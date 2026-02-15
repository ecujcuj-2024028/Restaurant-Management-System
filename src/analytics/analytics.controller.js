'use strict';

import { Review } from './review.model.js';
import mongoose from 'mongoose';

// publicar reseña (POST /analytics/reviews)
export const crearReview = async (req, res) => {
    try {
        const { usuarioId, restauranteId, platoId, rating, comentario, consumo } = req.body;

        // Validaciones
        if (!usuarioId || !restauranteId || !platoId) {
            return res.status(400).json({
                success: false,
                message: 'Los campos usuarioId, restauranteId y platoId son obligatorios'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'El rating debe ser un número entero entre 1 y 5'
            });
        }

        if (!comentario || comentario.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'El comentario debe tener al menos 10 caracteres'
            });
        }

        // Crear y guardar la review
        const nuevaReview = new Review({
            usuarioId: usuarioId.toString(),
            restauranteId: new mongoose.Types.ObjectId(restauranteId),
            platoId: new mongoose.Types.ObjectId(platoId),
            rating: Number(rating),
            comentario: comentario.trim(),
            estado: 'activa',
            consumo: consumo || {}
        });

        const reviewGuardada = await nuevaReview.save();

        return res.status(201).json({
            success: true,
            message: 'Reseña publicada exitosamente',
            data: reviewGuardada
        });

    } catch (error) {
        console.error('[crearReview] Error:', error.message);

        // Manejo de errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errores = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ success: false, message: 'Error de validación', errores });
        }

        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: 'ID con formato inválido' });
        }

        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

// obtener reviews por plato (GET /analytics/reviews/plato/:platoId)
export const getReviewsPorPlato = async (req, res) => {
    try {
        const { platoId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(platoId)) {
            return res.status(400).json({ success: false, message: 'platoId inválido' });
        }

        const platObjId = new mongoose.Types.ObjectId(platoId);

        // Traer reviews activas
        const reviews = await Review.find({ platoId: platObjId, estado: 'activa' })
            .sort({ createdAt: -1 })
            .lean();

        // Calcular promedio
        const totalReviews = reviews.length;
        const promedioRating = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(2)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                platoId,
                totalReviews,
                promedioRating: parseFloat(promedioRating),
                reviews
            }
        });

    } catch (error) {
        console.error('[getReviewsPorPlato] Error:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};


