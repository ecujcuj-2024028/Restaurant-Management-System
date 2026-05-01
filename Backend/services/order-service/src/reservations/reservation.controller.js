'use strict';

import Reservation from './reservation.model.js';
import Table       from '../tables/table.model.js';
import { sendReservationConfirmationEmail } from '../../helpers/email-service.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';

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
  POST /reservations  — Crear reserva (con transacción de PostgreSQL)
───────────────────────────────────────────────────────────────────────────── */
export const createReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { tableId, restaurantId, date, time, guestCount, notes } = req.body;
        const userId = req.user?.Id?.toString() || req.user?.id?.toString();

        /* ── 1. Validaciones de presencia ── */
        if (!tableId || !restaurantId || !date || !time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Los campos tableId, restaurantId, date y time son obligatorios.',
            });
        }

        /* ── 2. Verificar que la mesa existe y bloquear la fila ── */
        const table = await Table.findOne({
            where: {
                id: tableId,
                restaurant: restaurantId,
                isActive: true,
            },
            lock: true,
            transaction
        });

        if (!table) {
            await transaction.rollback();
            return res.status(404).json({
                success: false,
                message: 'La mesa no existe, no pertenece al restaurante indicado o está inactiva.',
            });
        }

        /* ── 3. Verificar disponibilidad ── */
        if (table.availability !== 'disponible') {
            await transaction.rollback();
            const estadoMsg = {
                ocupado  : 'La mesa ya se encuentra ocupada en este momento.',
                reservado: 'La mesa ya tiene una reserva activa. Por favor elige otra mesa o un horario diferente.',
            };
            return res.status(400).json({
                success: false,
                message: estadoMsg[table.availability] ?? `La mesa no está disponible (estado: ${table.availability}).`,
                table  : {
                    id          : table.id,
                    number      : table.number,
                    availability: table.availability,
                    capacity    : table.capacity,
                    location    : table.location,
                },
            });
        }

        /* ── 4. Verificar capacidad ── */
        if (guestCount && guestCount > table.capacity) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `La mesa #${table.number} tiene capacidad para ${table.capacity} comensales, pero se solicitaron ${guestCount}.`,
            });
        }

        /* ── 5. Verificar conflicto de horario ── */
        const conflicto = await Reservation.findOne({
            where: {
                tableId,
                date,
                time,
                status: { [Op.in]: ['pendiente', 'confirmada'] }
            },
            transaction
        });

        if (conflicto) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Ya existe una reserva ${conflicto.status} para la mesa #${table.number} el ${date} a las ${time}.`,
            });
        }

        /* ── 6. Crear la reserva ── */
        const reservation = await Reservation.create({
            tableId,
            userId,
            restaurantId,
            date,
            time,
            status    : 'confirmada',
            guestCount: guestCount || null,
            notes     : notes      || null,
        }, { transaction });

        /* ── 7. Actualizar estado de la mesa a 'reservado' ── */
        table.availability = 'reservado';
        await table.save({ transaction });

        await transaction.commit();

        /* ── 8. GT-03: Email de confirmación al cliente (background) ── */
        try {
            // Nota: En microservicios, los datos del usuario (email, nombre) ya vienen 
            // usualmente en el req.user si el middleware validate-JWT los extrajo del token.
            if (req.user && req.user.Email) {
                sendReservationConfirmationEmail({
                    customerEmail : req.user.Email,
                    customerName  : `${req.user.Name} ${req.user.Surname}`,
                    restaurantName: `Restaurante (${restaurantId})`,
                    tableNumber   : table.number,
                    tableLocation : table.location,
                    date,
                    time,
                    guestCount    : guestCount || null,
                    reservationId : reservation.id,
                }).catch(err => console.error('[Reservation] Error enviando email:', err.message));
            }
        } catch (emailErr) {
            console.error('[Reservation] Error al obtener datos para email:', emailErr.message);
        }

        /* ── 9. Retornar respuesta ── */
        const populatedReservation = await Reservation.findByPk(reservation.id, {
            include: [{ model: Table, as: 'table' }]
        });

        return res.status(201).json({
            success    : true,
            message    : `Reserva confirmada para la mesa #${table.number} el ${date} a las ${time}.`,
            reservation: populatedReservation,
        });

    } catch (error) {
        await transaction.rollback();
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                success: false,
                message: 'Conflicto: ya existe una reserva para esa mesa en el mismo horario.',
            });
        }
        return res.status(500).json({
            success: false,
            message: 'Error interno al crear la reserva.',
            error  : error.message,
        });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /reservations  — Reservas del usuario autenticado
───────────────────────────────────────────────────────────────────────────── */
export const getMyReservations = async (req, res) => {
    try {
        const userId = req.user?.Id?.toString() || req.user?.id?.toString();
        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { userId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const { count, rows } = await Reservation.findAndCountAll({
            where: filter,
            include: [{ model: Table, as: 'table' }],
            order: [['date', 'DESC'], ['time', 'DESC']],
            offset: skip,
            limit: limit
        });

        return res.status(200).json({
            success    : true,
            pagination : buildPaginationMeta(page, limit, count),
            reservations: rows,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   GET /reservations/restaurant/:restaurantId  — Reservas de un restaurante
───────────────────────────────────────────────────────────────────────────── */
export const getReservationsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { restaurantId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const { count, rows } = await Reservation.findAndCountAll({
            where: filter,
            include: [{ model: Table, as: 'table' }],
            order: [['date', 'DESC'], ['time', 'DESC']],
            offset: skip,
            limit: limit
        });

        return res.status(200).json({
            success    : true,
            pagination : buildPaginationMeta(page, limit, count),
            reservations: rows,
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────────────────────────────────────
   PATCH /reservations/:id/cancel  — Cancelar reserva y liberar mesa
───────────────────────────────────────────────────────────────────────────── */
export const cancelReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = req.user?.Id?.toString() || req.user?.id?.toString();
        const { id } = req.params;

        const reservation = await Reservation.findByPk(id, { transaction });

        if (!reservation) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        if (reservation.userId !== userId) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para cancelar esta reserva.',
            });
        }

        if (reservation.status === 'cancelada') {
            await transaction.rollback();
            return res.status(400).json({ success: false, message: 'La reserva ya está cancelada.' });
        }

        reservation.status = 'cancelada';
        await reservation.save({ transaction });

        const table = await Table.findByPk(reservation.tableId, { transaction });
        if (table) {
            table.availability = 'disponible';
            await table.save({ transaction });
        }

        await transaction.commit();

        const populated = await Reservation.findByPk(reservation.id, {
            include: [{ model: Table, as: 'table' }]
        });

        return res.status(200).json({
            success    : true,
            message    : 'Reserva cancelada y mesa liberada correctamente.',
            reservation: populated,
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({ success: false, message: error.message });
    }
};
