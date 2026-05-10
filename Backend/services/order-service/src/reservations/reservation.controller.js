'use strict';

import Reservation from './reservation.model.js';
import Table       from '../tables/table.model.js';
import { sendReservationConfirmationEmail } from '../../helpers/email-service.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';

const getUserIdFromRequest = (req) => {
    const userId = req.user?.Id?.toString() || req.user?.id?.toString() || req.userId?.toString();
    if (!userId) return null;
    const normalized = userId.trim().toLowerCase();
    if (normalized === '' || normalized === 'undefined' || normalized === 'null') return null;
    return userId.trim();
};

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

export const createReservation = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { tableId, restaurantId, date, time, guestCount, notes, customerName, customerPhone } = req.body;
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado. Token inválido o expirado.',
            });
        }

        if (!tableId || !restaurantId || !date || !time) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: 'Los campos tableId, restaurantId, date y time son obligatorios.',
            });
        }

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

        if (guestCount && guestCount > table.capacity) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `La mesa #${table.number} tiene capacidad para ${table.capacity} comensales, pero se solicitaron ${guestCount}.`,
            });
        }

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

        const reservation = await Reservation.create({
            tableId,
            userId,
            restaurantId,
            date,
            time,
            status       : 'confirmada',
            guestCount   : guestCount || null,
            notes        : notes      || null,
            customerName : customerName?.trim()  || null,
            customerPhone: customerPhone?.trim() || null,
        }, { transaction });

        table.availability = 'reservado';
        await table.save({ transaction });

        await transaction.commit();

        try {
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

export const getMyReservations = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado. Token inválido o expirado.',
            });
        }

        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { userId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const { count, rows } = await Reservation.findAndCountAll({
            where  : filter,
            include: [{ model: Table, as: 'table' }],
            order  : [['date', 'DESC'], ['time', 'DESC']],
            offset : skip,
            limit  : limit,
        });

        return res.status(200).json({
            success     : true,
            pagination  : buildPaginationMeta(page, limit, count),
            reservations: rows,
        });

    } catch (error) {
        console.error('[getMyReservations Error]:', error.message);
        console.error('[getMyReservations Stack]:', error.stack);
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const getReservationsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { status, date } = req.query;
        const { page, limit, skip } = getPagination(req.query);

        const filter = { restaurantId };
        if (status) filter.status = status;
        if (date)   filter.date   = date;

        const { count, rows } = await Reservation.findAndCountAll({
            where  : filter,
            include: [{ model: Table, as: 'table' }],
            order  : [['date', 'DESC'], ['time', 'DESC']],
            offset : skip,
            limit  : limit,
        });

        return res.status(200).json({
            success     : true,
            pagination  : buildPaginationMeta(page, limit, count),
            reservations: rows,
        });

    } catch (error) {
        console.error('[getReservationsByRestaurant Error]:', error.message);
        console.error('[getReservationsByRestaurant Stack]:', error.stack);
        return res.status(500).json({ 
            success: false, 
            message: error.message,
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

export const updateReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = getUserIdFromRequest(req);
        const { id } = req.params;
        const { status, customerName, customerPhone, guestCount, notes } = req.body;

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado. Token inválido o expirado.',
            });
        }

        const reservation = await Reservation.findByPk(id, { transaction });

        if (!reservation) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Reserva no encontrada.' });
        }

        if (reservation.userId !== userId) {
            await transaction.rollback();
            return res.status(403).json({
                success: false,
                message: 'No tienes permiso para editar esta reserva.',
            });
        }

        if (status !== undefined)       reservation.status        = status;
        if (customerName !== undefined)  reservation.customerName  = customerName;
        if (customerPhone !== undefined) reservation.customerPhone = customerPhone;
        if (guestCount !== undefined)    reservation.guestCount    = guestCount;
        if (notes !== undefined)         reservation.notes         = notes;

        await reservation.save({ transaction });
        await transaction.commit();

        const populated = await Reservation.findByPk(reservation.id, {
            include: [{ model: Table, as: 'table' }],
        });

        return res.status(200).json({
            success    : true,
            message    : 'Reserva actualizada correctamente.',
            reservation: populated,
        });

    } catch (error) {
        await transaction.rollback();
        return res.status(500).json({
            success: false,
            message: 'Error interno al actualizar la reserva.',
            error  : error.message,
        });
    }
};

export const cancelReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const userId = getUserIdFromRequest(req);

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado. Token inválido o expirado.',
            });
        }

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