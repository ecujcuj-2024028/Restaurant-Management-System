'use strict';

import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: String,
            required: true,
            index: true
        },
        restaurantId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Restaurant',
            index: true
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            required: true
        },
        type: {
            type: String,
            enum: ['info', 'warning', 'success', 'error', 'order', 'inventory', 'reservation'],
            default: 'info'
        },
        isRead: {
            type: Boolean,
            default: false
        },
        link: {
            type: String,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Índice para obtener notificaciones no leídas rápido
notificationSchema.index({ userId: 1, isRead: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
