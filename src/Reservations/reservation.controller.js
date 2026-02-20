'use strict';

import mongoose from 'mongoose';
import Reservation from './reservation.model.js';
import Table       from '../tables/table.model.js';

/* ─────────────────────────────────────────────────────────────────────────────
  Helper: paginación
───────────────────────────────────────────────────────────────────────────── */
const getPagination = (query) => {
    const page  = Math.max(1, parseInt(query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 10));
    return { page, limit, skip: (page - 1) * limit };
};

const buildPaginationMeta = (page, limit, total) => ({
    page,
    limit,
    total,
    totalPages : Math.ceil(total / limit),
    hasNextPage: page < Math.ceil(total / limit),
    hasPrevPage: page > 1,
});

/* ─────────────────────────────────────────────────────────────────────────────
  POST /reservations
  Crea una reserva verificando en tiempo real el estado de la mesa
───────────────────────────────────────────────────────────────────────────── */
export const createReservation = async (req, res) => {
    // Usamos una sesión de Mongoose para garantizar atomicidad:
    // si algo falla después de marcar la mesa como 'reservado', se revierte.
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const {
            tableId,
            restaurantId,
            date,
            time,
            guestCount,
            notes,
        } = req.body;

        // ── userId viene del token JWT (puesto por el middleware validateJWT) ──
        const userId = req.user?.Id?.toString() || req.user?.id?.toString();

        /* ── 1. Validaciones de presencia ── */
        if (!tableId || !restaurantId || !date || !time) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: 'Los campos tableId, restaurantId, date y time son obligatorios.',
            });
        }

        /* ── 2. Verificar que la mesa existe y pertenece al restaurante ── */
        const table = await Table.findOne({
            _id       : tableId,
            restaurant: restaurantId,
            isActive  : true,
        }).session(session);

        if (!table) {
            await session.abortTransaction();
            return res.status(404).json({
                success: false,
                message: 'La mesa no existe, no pertenece al restaurante indicado o está inactiva.',
            });
        }

        /* ── 3. Verificar disponibilidad en tiempo real ── */
        if (table.availability !== 'disponible') {
            await session.abortTransaction();

            const estadoMsg = {
                ocupado  : 'La mesa ya se encuentra ocupada en este momento.',
                reservado: 'La mesa ya tiene una reserva activa. Por favor elige otra mesa o un horario diferente.',
            };

            return res.status(400).json({
                success: false,
                message: estadoMsg[table.availability] ?? `La mesa no está disponible (estado: ${table.availability}).`,
                table  : {
                    _id         : table._id,
                    number      : table.number,
                    availability: table.availability,
                    capacity    : table.capacity,
                    location    : table.location,
                },
            });
        }

        /* ── 4. Verificar capacidad si se indicó guestCount ── */
        if (guestCount && guestCount > table.capacity) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `La mesa #${table.number} tiene capacidad para ${table.capacity} comensales, pero se solicitaron ${guestCount}.`,
            });
        }

        /* ── 5. Verificar que no haya otra reserva activa para ese turno ── */
        const conflicto = await Reservation.findOne({
            tableId,
            date,
            time,
            status: { $in: ['pendiente', 'confirmada'] },
        }).session(session);

        if (conflicto) {
            await session.abortTransaction();
            return res.status(400).json({
                success: false,
                message: `Ya existe una reserva ${conflicto.status} para la mesa #${table.number} el ${date} a las ${time}.`,
            });
        }

        /* ── 6. Crear la reserva con status 'confirmada' ── */
        const [reservation] = await Reservation.create(
            [
                {
                    tableId,
                    userId,
                    restaurantId,
                    date,
                    time,
                    status    : 'confirmada',
                    guestCount: guestCount || undefined,
                    notes     : notes      || undefined,
                },
            ],
            { session }
        );

        /* ── 7. Actualizar estado de la mesa a 'reservado' ── */
        await Table.findByIdAndUpdate(
            tableId,
            { availability: 'reservado' },
            { session, new: true }
        );

        /* ── 8. Confirmar transacción ── */
        await session.commitTransaction();

        return res.status(201).json({
            success    : true,
            message    : `Reserva confirmada para la mesa #${table.number} el ${date} a las ${time}.`,
            reservation: await reservation.populate([
                { path: 'tableId',      select: 'number capacity location availability' },
                { path: 'restaurantId', select: 'name address'                          },
            ]),
        });

    } catch (error) {
        await session.abortTransaction();

        // Duplicado por índice único
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Conflicto: ya existe una reserva para esa mesa en el mismo horario. Por favor intenta de nuevo.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al crear la reserva.',
            error  : error.message,
        });

    } finally {
        session.endSession();
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /reservations
   Lista reservas del usuario autenticado
───────────────────────────────────────────────────────────────────────────── */
export const getMyReservations = async (req, res) => {
    try {
        const userId = req.user?.Id?.toString() || req.user?.id?.toString();
        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { userId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const [total, reservations] = await Promise.all([
            Reservation.countDocuments(filter),
            Reservation.find(filter)
                .populate('tableId',      'number capacity location availability')
                .populate('restaurantId', 'name address')
                .sort({ date: -1, time: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        return res.status(200).json({
            success     : true,
            pagination  : buildPaginationMeta(page, limit, total),
            reservations,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /reservations/restaurant/:restaurantId
   Lista reservas de un restaurante (para el dueño / admin)
───────────────────────────────────────────────────────────────────────────── */
export const getReservationsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { restaurantId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const [total, reservations] = await Promise.all([
            Reservation.countDocuments(filter),
            Reservation.find(filter)
                .populate('tableId',      'number capacity location availability')
                .populate('restaurantId', 'name address')
                .sort({ date: -1, time: -1 })
                .skip(skip)
                .limit(limit),
        ]);

        return res.status(200).json({
            success     : true,
            pagination  : buildPaginationMeta(page, limit, total),
            reservations,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /reservations/:id/cancel
   Cancela una reserva y libera la mesa 
───────────────────────────────────────────────────────────────────────────── */
export const cancelReservation = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const userId        = req.user?.Id?.toString() || req.user?.id?.toString();
        const { id }        = req.params;

        const reservation = await Reservation.findById(id).session(session);

        if (!reservation) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        // Solo el dueño de la reserva puede cancelarla (o un admin, si tienes ese rol)
        if (reservation.userId !== userId) {
            await session.abortTransaction();
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar esta reserva.',
            });
        }

        if (reservation.status === 'cancelada') {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: 'La reserva ya está cancelada.' });
        }

        /* ── Cancelar reserva ── */
        reservation.status = 'cancelada';
        await reservation.save({ session });

        /* ── Liberar la mesa → 'disponible' ── */
        await Table.findByIdAndUpdate(
            reservation.tableId,
            { availability: 'disponible' },
            { session }
        );

        await session.commitTransaction();

        return res.status(200).json({
            success    : true,
            message    : 'Reserva cancelada y mesa liberada correctamente.',
            reservation: await reservation.populate([
                { path: 'tableId',      select: 'number capacity location availability' },
                { path: 'restaurantId', select: 'name address'                          },
            ]),
        });

    } catch (error) {
        await session.abortTransaction();
        return res.status(500).json({ success: false, message: error.message });
    } finally {
        session.endSession();
    }
};