'use strict';

import Event from '../Eventos/events-model.js';

export const getEvents = async (req, res) => {
    try {
        const { status, restaurant } = req.query;
        const filter = { isActive: true };

        if (status)     filter.status     = status;
        if (restaurant) filter.restaurant = restaurant;

        const events = await Event.find(filter)
            .populate('restaurant', 'name')
            .sort({ startDate: 1 });

        return res.status(200).json({
            success: true,
            count: events.length,
            events
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const getEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate('restaurant', 'name');

        if (!event)
            return res.status(404).json({
                success: false,
                message: `Evento no encontrado con id ${req.params.id}`
            });

        return res.status(200).json({
            success: true,
            event
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const createEvent = async (req, res) => {
    try {
        const data = req.body;

        const event = await Event.create({
            ...data,
            restaurant: req.user.restaurant
        });

        return res.status(201).json({
            success: true,
            event
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event)
            return res.status(404).json({
                success: false,
                message: `Evento no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            event.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para actualizar este evento'
            });

        const updated = await Event.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            success: true,
            event: updated
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const updateEventStatus = async (req, res) => {
    try {
        const allowed = ['scheduled', 'ongoing', 'completed', 'cancelled'];

        if (!allowed.includes(req.body.status))
            return res.status(400).json({
                success: false,
                message: `Estado inválido. Valores permitidos: ${allowed.join(', ')}`
            });

        const event = await Event.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true, runValidators: true }
        );

        if (!event)
            return res.status(404).json({
                success: false,
                message: `Evento no encontrado con id ${req.params.id}`
            });

        return res.status(200).json({
            success: true,
            event
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event)
            return res.status(404).json({
                success: false,
                message: `Evento no encontrado con id ${req.params.id}`
            });

        if (req.user.role !== 'admin' &&
            event.restaurant.toString() !== req.user.restaurant.toString())
            return res.status(403).json({
                success: false,
                message: 'No autorizado para eliminar este evento'
            });

        await Event.findByIdAndUpdate(
            req.params.id,
            { isActive: false, status: 'cancelled' }
        );

        return res.status(200).json({
            success: true,
            message: 'Evento cancelado correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};