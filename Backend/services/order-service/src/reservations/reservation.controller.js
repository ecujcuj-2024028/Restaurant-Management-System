'use strict';

import Reservation from './reservation.model.js';
import Table       from '../tables/table.model.js';
import Restaurant  from '../restaurants/restaurant.model.js';
import { sendReservationConfirmationEmail } from '../../helpers/email-service.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import axios from 'axios';

const GATEWAY_INTERNAL_URL = process.env.GATEWAY_INTERNAL_URL || 'http://api_gateway:3000/restaurantManagement/v1/internal/emit';
const NOTIFICATIONS_INTERNAL_URL = process.env.NOTIFICATIONS_INTERNAL_URL || 'http://api_gateway:3000/restaurantManagement/v1/notifications/internal/create';

const createPersistentNotification = async (data) => {
    try {
        await axios.post(NOTIFICATIONS_INTERNAL_URL, data);
    } catch (err) {
        console.error('[NotificationError] Error creating persistent notification:', err.message);
    }
};

const getOwnedRestaurantIds = async (req) => {
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);
    if (isSystemAdmin) return null;
    if (!isRestauranteAdmin) return [];
    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id.toString());
};

const getUserIdFromRequest = (req) => {
    return req.userId?.toString() || req.user?.id?.toString() || req.user?._id?.toString();
};

const getTimeWindow = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(2000, 0, 1, hours, minutes);
    const windowStart = new Date(start.getTime() - 119 * 60000); 
    const windowEnd = new Date(start.getTime() + 119 * 60000);
    const format = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return [format(windowStart), format(windowEnd)];
};

const notifyReservationEvent = async (event, reservation) => {
    try {
        const resData = reservation.toJSON ? reservation.toJSON() : reservation;
        
        // Forzar la obtención de los datos frescos del restaurante para evitar el "undefined" o el corte
        const restaurant = await Restaurant.findById(resData.restaurantId).select('name phone');
        const restName = restaurant?.name || 'el restaurante';
        const restPhone = restaurant?.phone || 'la sede';

        if (['reservation_updated', 'reservation_cancelled'].includes(event)) {
            let title = 'Actualización de Reserva';
            let message = `Tu reserva en ${restName} está ahora: ${resData.status}`;

            if (resData.status === 'confirmada') {
                message = "Reservacion confirmada. Te esperamos con mucho gusto";
            } else if (resData.status === 'cancelada') {
                // Mensaje exacto solicitado por el usuario, asegurando el número
                message = `lamentamos decirle que su reservacion fue rechazarla, si quiere puede contactarse al restaurante numero ${restPhone}`;
            } else if (resData.status === 'completada') {
                message = "Fue un gusto servirte, vuelve de nuevo";
            }

            await createPersistentNotification({
                userId: resData.userId,
                restaurantId: resData.restaurantId,
                type: 'reservation',
                title,
                message,
                link: '/reservations'
            });
        }

        await axios.post(GATEWAY_INTERNAL_URL, {
            event,
            data: { ...resData, restaurant },
            room: `restaurant_${resData.restaurantId}`
        });
        
        await axios.post(GATEWAY_INTERNAL_URL, {
            event,
            data: { ...resData, restaurant },
            room: `user_${resData.userId}`
        });
    } catch (err) {
        console.error(`[SocketError] Error notifying ${event}:`, err.message);
    }
};

export const createReservation = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        const { tableId, restaurantId, date, time, guestCount, notes, customerName, customerPhone, customerEmail } = req.body;
        const userId = getUserIdFromRequest(req);
        const userRoles = req.userRoles || [];
        const isAdmin = userRoles.some(r => r === ADMIN_SISTEMA || r === ADMIN_RESTAURANTE);

        if (!userId) {
            await transaction.rollback();
            return res.status(401).json({ success: false, message: 'Usuario no autenticado.' });
        }

        const table = await Table.findOne({
            where: { id: tableId, restaurant: restaurantId, isActive: true },
            lock: true, transaction
        });

        if (!table) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: 'Mesa no disponible.' });
        }

        const [timeStart, timeEnd] = getTimeWindow(time);
        const conflicto = await Reservation.findOne({
            where: {
                tableId, date,
                status: { [Op.in]: ['pendiente', 'confirmada'] },
                time: { [Op.between]: [timeStart, timeEnd] }
            },
            transaction
        });

        if (conflicto) {
            await transaction.rollback();
            return res.status(400).json({
                success: false,
                message: `Conflicto: Mesa ocupada a las ${conflicto.time}.`
            });
        }

        const initialStatus = isAdmin ? 'confirmada' : 'pendiente';
        const reservation = await Reservation.create({
            tableId, userId, restaurantId, date, time,
            status: initialStatus,
            guestCount, notes, customerName, customerPhone, customerEmail
        }, { transaction });

        if (initialStatus === 'confirmada') {
            table.availability = 'reservado';
            await table.save({ transaction });
        }

        await transaction.commit();

        const populatedReservation = await Reservation.findByPk(reservation.id, {
            include: [{ model: Table, as: 'table' }]
        });

        if (reservation.status === 'confirmada') {
            const recipientEmail = customerEmail || req.user?.Email;
            if (recipientEmail) {
                sendReservationConfirmationEmail({
                    customerEmail: recipientEmail,
                    customerName: customerName || (req.user ? `${req.user.Name} ${req.user.Surname}` : 'Cliente'),
                    restaurantName: `Sede ${restaurantId}`,
                    tableNumber: table.number,
                    tableLocation: table.location,
                    date, time, guestCount,
                    reservationId: reservation.id,
                    status: 'confirmada'
                }).catch(e => console.error('Error email:', e.message));
            }
        }

        notifyReservationEvent('reservation_created', populatedReservation || reservation);

        return res.status(201).json({ 
            success: true, 
            message: isAdmin ? 'Confirmada.' : 'Solicitud pendiente.',
            reservation: populatedReservation || reservation
        });
    } catch (error) {
        if (transaction) await transaction.rollback();
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const reservation = await Reservation.findByPk(id, {
            include: [{ model: Table, as: 'table' }]
        });
        
        if (!reservation) return res.status(404).json({ message: 'No encontrada' });

        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === reservation.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const previousStatus = reservation.status;

        if (status === 'confirmada' && previousStatus !== 'confirmada') {
            await Table.update({ availability: 'reservado' }, { where: { id: reservation.tableId } });
            if (reservation.customerEmail) {
                sendReservationConfirmationEmail({
                    customerEmail: reservation.customerEmail,
                    customerName: reservation.customerName || 'Cliente',
                    restaurantName: `Sede ${reservation.restaurantId}`,
                    tableNumber: reservation.table?.number,
                    tableLocation: reservation.table?.location,
                    date: reservation.date,
                    time: reservation.time,
                    guestCount: reservation.guestCount,
                    reservationId: reservation.id,
                    status: 'confirmada'
                }).catch(e => console.error('[Update] Error email:', e.message));
            }
        }
        
        if (['cancelada', 'completada'].includes(status)) {
            await Table.update({ availability: 'disponible' }, { where: { id: reservation.tableId } });
        }

        reservation.status = status;
        await reservation.save();

        notifyReservationEvent('reservation_updated', reservation);
        
        return res.json({ success: true, reservation });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getMyReservations = async (req, res) => {
    try {
        const userId = getUserIdFromRequest(req);
        const ownedIds = await getOwnedRestaurantIds(req);
        const { startDate, endDate, status } = req.query;
        
        let filter;
        if (ownedIds === null) {
            filter = {};
        } else if (ownedIds.length > 0) {
            filter = { restaurantId: { [Op.in]: ownedIds } };
        } else {
            filter = { userId };
        }

        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            filter.date = { [Op.gte]: startDate };
        } else if (endDate) {
            filter.date = { [Op.lte]: endDate };
        }

        const { count, rows } = await Reservation.findAndCountAll({
            where: filter,
            include: [{ model: Table, as: 'table' }],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });

        const reservationsWithRest = await Promise.all(rows.map(async (res) => {
            const resData = res.toJSON();
            try {
                const restaurant = await Restaurant.findById(resData.restaurantId).select('name photos phone');
                resData.restaurant = restaurant;
            } catch (e) {
                resData.restaurant = { name: 'Restaurante' };
            }
            return resData;
        }));
        
        return res.json({ success: true, reservations: reservationsWithRest });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getReservationsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const { startDate, endDate, status } = req.query;
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }
        const filter = { restaurantId };
        if (status) filter.status = status;
        if (startDate && endDate) {
            filter.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            filter.date = { [Op.gte]: startDate };
        } else if (endDate) {
            filter.date = { [Op.lte]: endDate };
        }
        const { count, rows } = await Reservation.findAndCountAll({
            where: filter,
            include: [{ model: Table, as: 'table' }],
            order: [['date', 'DESC'], ['time', 'ASC']]
        });
        return res.json({ success: true, reservations: rows });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const cancelReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = getUserIdFromRequest(req);
        const reservation = await Reservation.findByPk(id);
        if (!reservation) return res.status(404).json({ message: 'No encontrada' });
        const ownedIds = await getOwnedRestaurantIds(req);
        const isRestaurantOwner = ownedIds && ownedIds.some(oid => oid.toString() === reservation.restaurantId.toString());
        const isReservationOwner = reservation.userId.toString() === userId;
        if (ownedIds !== null && !isRestaurantOwner && !isReservationOwner) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        reservation.status = 'cancelada';
        await reservation.save();
        await Table.update({ availability: 'disponible' }, { where: { id: reservation.tableId } });
        notifyReservationEvent('reservation_cancelled', reservation);
        return res.json({ success: true, message: 'Cancelada' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

export const getAvailableHours = async (req, res) => {
    try {
        const { tableId, restaurantId, date } = req.query;
        if (!tableId || !restaurantId || !date) {
            return res.status(400).json({ success: false, message: 'Faltan parámetros' });
        }
        const restaurant = await Restaurant.findById(restaurantId).select('openingTime closingTime');
        if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurante no encontrado' });
        const reservations = await Reservation.findAll({
            where: { tableId, date, status: { [Op.in]: ['pendiente', 'confirmada'] } },
            attributes: ['time'], order: [['time', 'ASC']]
        });
        const occupiedTimes = reservations.map(r => r.time);
        const availableSlots = [];
        const [startHour, startMin] = restaurant.openingTime.split(':').map(Number);
        const [endHour, endMin] = restaurant.closingTime.split(':').map(Number);
        let current = new Date(2000, 0, 1, startHour, startMin);
        const end = new Date(2000, 0, 1, endHour, endMin);
        const today = new Date().toISOString().split('T')[0];
        const now = new Date();
        const isToday = date === today;
        while (current < end) {
            const timeStr = `${String(current.getHours()).padStart(2, '0')}:${String(current.getMinutes()).padStart(2, '0')}`;
            let isPast = false;
            if (isToday) {
                const slotTime = new Date();
                slotTime.setHours(current.getHours(), current.getMinutes(), 0, 0);
                if (slotTime < now) isPast = true;
            }
            if (!isPast) {
                const [windowStart, windowEnd] = getTimeWindow(timeStr);
                const isOccupied = occupiedTimes.some(occ => occ >= windowStart && occ <= windowEnd);
                availableSlots.push({ time: timeStr, available: !isOccupied });
            }
            current.setHours(current.getHours() + 1);
        }
        return res.json({ success: true, restaurantHours: { opening: restaurant.openingTime, closing: restaurant.closingTime }, availableSlots });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
