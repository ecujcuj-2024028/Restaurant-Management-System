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

export const getPlatosMasVendidos = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 10;
        const restauranteId = req.query.restauranteId;

        // pa que tengamos solo reviews activas
        const matchStage = { estado: 'activa' };

        if (restauranteId && mongoose.Types.ObjectId.isValid(restauranteId)) {
            matchStage.restauranteId = new mongoose.Types.ObjectId(restauranteId);
        }

        const resultado = await Review.aggregate([
            { $match: matchStage },

            {
                $group: {
                    _id: '$platoId',
                    vecesOrdenado: { $sum: 1 },              
                    promedioRating: { $avg: '$rating' },
                    totalIngresosAproximados: { $sum: '$consumo.montoTotal' },
                    ultimaReseña: { $max: '$createdAt' }
                }
            },

            { $sort: { vecesOrdenado: -1 } },

            { $limit: limite },

            {
                $project: {
                    _id: 0,
                    platoId: '$_id',
                    vecesOrdenado: 1,
                    promedioRating: { $round: ['$promedioRating', 2] },
                    totalIngresosAproximados: 1,
                    ultimaReseña: 1
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: `Top ${limite} platos más pedidos`,
            total: resultado.length,
            data: resultado
        });

    } catch (error) {
        console.error('[getPlatosMasVendidos] Error:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const getStatsAdmin = async (req, res) => {
    try {
        const mesesAtras = parseInt(req.query.meses) || 6;
        const fechaInicio = new Date();
        fechaInicio.setMonth(fechaInicio.getMonth() - mesesAtras);

        // ── Estadística 1: Ingresos y reviews por mes 
        const ingresosPorMes = await Review.aggregate([
            {
                $match: {
                    estado: 'activa',
                    'consumo.fecha': { $gte: fechaInicio }
                }
            },
            {
                $group: {
                    _id: {
                        año: { $year: '$consumo.fecha' },
                        mes: { $month: '$consumo.fecha' }
                    },
                    totalIngresos: { $sum: '$consumo.montoTotal' },
                    totalReviews: { $sum: 1 },
                    promedioRating: { $avg: '$rating' }
                }
            },
            { $sort: { '_id.año': 1, '_id.mes': 1 } },
            {
                $project: {
                    _id: 0,
                    periodo: {
                        $concat: [
                            { $toString: '$_id.año' }, '-',
                            {
                                $cond: {
                                    if: { $lt: ['$_id.mes', 10] },
                                    then: { $concat: ['0', { $toString: '$_id.mes' }] },
                                    else: { $toString: '$_id.mes' }
                                }
                            }
                        ]
                    },
                    totalIngresos: 1,
                    totalReviews: 1,
                    promedioRating: { $round: ['$promedioRating', 2] }
                }
            }
        ]);

        // ── Estadística 2: Distribución de ratings
        const distribucionRatings = await Review.aggregate([
            { $match: { estado: 'activa' } },
            {
                $group: {
                    _id: '$rating',
                    cantidad: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } },
            {
                $project: {
                    _id: 0,
                    rating: '$_id',
                    cantidad: 1
                }
            }
        ]);

        // ── Estadística 3: Satisfacción por restaurante 
        const statsPorRestaurante = await Review.aggregate([
            { $match: { estado: 'activa' } },
            {
                $group: {
                    _id: '$restauranteId',
                    totalReviews: { $sum: 1 },
                    promedioRating: { $avg: '$rating' },
                    ingresosTotales: { $sum: '$consumo.montoTotal' },
                    platosDistintos: { $addToSet: '$platoId' }
                }
            },
            {
                $project: {
                    _id: 0,
                    restauranteId: '$_id',
                    totalReviews: 1,
                    promedioRating: { $round: ['$promedioRating', 2] },
                    ingresosTotales: 1,
                    platosConReseña: { $size: '$platosDistintos' }
                }
            },
            { $sort: { ingresosTotales: -1 } }
        ]);

        // ── Resumen general 
        const resumenGeneral = await Review.aggregate([
            { $match: { estado: 'activa' } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    promedioGlobalRating: { $avg: '$rating' },
                    ingresosTotales: { $sum: '$consumo.montoTotal' },
                    platosDistintos: { $addToSet: '$platoId' },
                    restaurantesDistintos: { $addToSet: '$restauranteId' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalReviews: 1,
                    promedioGlobalRating: { $round: ['$promedioGlobalRating', 2] },
                    ingresosTotales: 1,
                    totalPlatosConReseña: { $size: '$platosDistintos' },
                    totalRestaurantesActivos: { $size: '$restaurantesDistintos' }
                }
            }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Estadísticas generales del sistema',
            data: {
                resumenGeneral: resumenGeneral[0] || {},
                ingresosPorMes,           
                distribucionRatings,     
                statsPorRestaurante       
            }
        });

    } catch (error) {
        console.error('[getStatsAdmin] Error:', error.message);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

