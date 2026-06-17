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

// Helper para crear notificaciones persistentes
const createPersistentNotification = async (data) => {
    try {
        await axios.post(NOTIFICATIONS_INTERNAL_URL, data);
    } catch (err) {
        console.error('[NotificationError] Error creating persistent notification:', err.message);
    }
};

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) return []; // Otros roles

    const myRestaurants = await Restaurant.find({ 
        ownerId: req.userId, 
        isActive: true 
    }, '_id');
    
    return myRestaurants.map(r => r._id.toString());
};

const getUserIdFromRequest = (req) => {
    return req.userId?.toString() || req.user?.id?.toString() || req.user?._id?.toString();
};

const getTimeWindow = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const start = new Date(2000, 0, 1, hours, minutes);
    const end = new Date(2000, 0, 1, hours, minutes);
    const windowStart = new Date(start.getTime() - 119 * 60000); 
    const windowEnd = new Date(end.getTime() + 119 * 60000);
    const format = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return [format(windowStart), format(windowEnd)];
};

// Helper interno para notificar reservaciones con datos poblados
const notifyReservationEvent = async (event, reservation) => {
    try {
        const resData = reservation.toJSON ? reservation.toJSON() : reservation;
        
        // Intentar poblar el nombre del restaurante desde MongoDB si no existe
        if (!resData.restaurant || !resData.restaurant.name) {
            try {
                const restaurant = await Restaurant.findById(resData.restaurantId).select('name photos');
                if (restaurant) resData.restaurant = restaurant;
            } catch (e) {
                resData.restaurant = { name: 'Restaurante' };
            }
        }

        // Persistir notificación para el cliente si es actualización o cancelación
        if (['reservation_updated', 'reservation_cancelled'].includes(event)) {
            createPersistentNotification({
                userId: resData.userId,
                restaurantId: resData.restaurantId,
                type: 'reservation',
                title: 'Actualización de Reserva',
                message: `Tu reserva en ${resData.restaurant?.name || 'el restaurante'} está ahora: ${resData.status}`,
                link: '/reservations'
            });
        }

        // Notificar al restaurante vía Sockets
        await axios.post(GATEWAY_INTERNAL_URL, {
            event,
            data: resData,
            room: `restaurant_${resData.restaurantId}`
        });
        
        // Notificar al usuario vía Sockets
        await axios.post(GATEWAY_INTERNAL_URL, {
            event,
            data: resData,
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

        // Notificar vía WebSockets
        notifyReservationEvent('reservation_created', reservation);

        return res.status(201).json({ 
            success: true, 
            message: isAdmin ? 'Confirmada.' : 'Solicitud pendiente.',
            reservation 
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

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(oid => oid.toString() === reservation.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para esta reservación' });
        }

        const previousStatus = reservation.status;

        if (status === 'confirmada' && previousStatus !== 'confirmada') {
            await Table.update({ availability: 'reservado' }, { where: { id: reservation.tableId } });
            
            const recipientEmail = reservation.customerEmail;
            
            if (recipientEmail) {
                sendReservationConfirmationEmail({
                    customerEmail: recipientEmail,
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

        // Notificar vía WebSockets
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

        // Filtro por estado
        if (status) {
            filter.status = status;
        }

        // Filtro por fecha
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

        // Poblar manualmente los datos del restaurante desde MongoDB
        const reservationsWithRest = await Promise.all(rows.map(async (res) => {
            const resData = res.toJSON();
            try {
                const restaurant = await Restaurant.findById(resData.restaurantId).select('name photos');
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

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para ver reservaciones de este restaurante' });
        }

        const filter = { restaurantId };
        
        // Filtro por estado
        if (status) filter.status = status;

        // Filtro por fecha
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

        // SEGURIDAD: Dueño de reserva o Dueño de restaurante
        const ownedIds = await getOwnedRestaurantIds(req);
        const isRestaurantOwner = ownedIds && ownedIds.some(oid => oid.toString() === reservation.restaurantId.toString());
        const isReservationOwner = reservation.userId.toString() === userId;

        if (ownedIds !== null && !isRestaurantOwner && !isReservationOwner) {
            return res.status(403).json({ message: 'No autorizado' });
        }

        reservation.status = 'cancelada';
        await reservation.save();

        await Table.update({ availability: 'disponible' }, { where: { id: reservation.tableId } });

        // Notificar vía WebSockets
        notifyReservationEvent('reservation_cancelled', reservation);

        return res.json({ success: true, message: 'Cancelada' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};
