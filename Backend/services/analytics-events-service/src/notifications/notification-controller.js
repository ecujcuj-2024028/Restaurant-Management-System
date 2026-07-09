'use strict';

import Notification from './notification-model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { Op } from 'sequelize';
import axios from 'axios';

const GATEWAY_INTERNAL_URL = process.env.GATEWAY_INTERNAL_URL || 'http://api_gateway:3000/restaurantManagement/v1/internal/emit';

// Helper para emitir via socket
const emitSocketNotification = async (notification) => {
    try {
        await axios.post(GATEWAY_INTERNAL_URL, {
            event: 'new_notification',
            data: notification,
            room: `user_${notification.userId}`
        });
    } catch (err) {
        console.error('[SocketError] Error emitting notification:', err.message);
    }
};

/**
 * Obtener notificaciones del usuario autenticado
 */
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.userId;
        let { limit = 20, unreadOnly = false, restaurantId } = req.query;

        // Si no viene restaurantId, intentamos buscar si este usuario es dueño de algún restaurante
        if (!restaurantId && userId) {
            const userRestaurant = await Restaurant.findOne({ ownerId: userId, isActive: true });
            if (userRestaurant) {
                restaurantId = userRestaurant._id.toString();
            }
        }

        // ── AUTO-GENERACIÓN DE NOTIFICACIONES DE STOCK BAJO ──
        // Solo intentamos generar alertas si detectamos un restaurante asociado
        if (restaurantId) {
            const allItems = await InventoryItem.findAll({
                where: { RestaurantId: restaurantId, IsActive: true },
                raw: true
            });

            const lowStockBasics = allItems.filter(i => {
                const isBasic = !i.MongoProductId;
                const isLow = parseFloat(i.Quantity) <= parseFloat(i.MinStock);
                return isBasic && isLow;
            });

            for (const item of lowStockBasics) {
                const today = new Date();
                today.setHours(0,0,0,0);

                const existing = await Notification.findOne({
                    userId,
                    restaurantId,
                    type: 'inventory',
                    title: { $regex: item.Name, $options: 'i' },
                    isRead: false,
                    createdAt: { $gte: today }
                });

                if (!existing) {
                    const newNotif = await Notification.create({
                        userId,
                        restaurantId,
                        type: 'inventory',
                        title: `Stock Bajo: ${item.Name}`,
                        message: `El insumo básico "${item.Name}" tiene un stock de ${item.Quantity} ${item.Unit}. El mínimo es ${item.MinStock}.`,
                        link: '/inventory'
                    });
                    emitSocketNotification(newNotif);
                }
            }
        }

        const filter = { userId };
        if (unreadOnly === 'true') filter.isRead = false;

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const unreadCount = await Notification.countDocuments({ userId, isRead: false });

        return res.status(200).json({
            success: true,
            notifications,
            unreadCount
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Marcar una notificación como leída
 */
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const notification = await Notification.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Marcar todas las notificaciones como leídas
 */
export const markAllAsRead = async (req, res) => {
    try {
        const userId = req.userId;
        await Notification.updateMany({ userId, isRead: false }, { isRead: true });

        return res.status(200).json({ success: true, message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const result = await Notification.findOneAndDelete({ _id: id, userId });

        if (!result) {
            return res.status(404).json({ success: false, message: 'Notificación no encontrada' });
        }

        return res.status(200).json({ success: true, message: 'Notificación eliminada' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Crear una nueva notificación (invocado internamente por otros servicios)
 */
export const createNotification = async (req, res) => {
    try {
        const notification = new Notification(req.body);
        await notification.save();

        // Emitir por socket
        emitSocketNotification(notification);

        return res.status(201).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Helper interno para crear notificaciones (usado por otros controladores)
 */
export const createInternalNotification = async (data) => {
    try {
        const notification = new Notification(data);
        await notification.save();
        return notification;
    } catch (error) {
        console.error('Error creating internal notification:', error);
        return null;
    }
};
