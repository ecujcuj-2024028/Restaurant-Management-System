import { Review } from './review.model.js';
import Order from '../orders/order.model.js';
import ExternalOrder from '../orders/external-order.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import mongoose from 'mongoose';
import { ADMIN_SISTEMA, ADMIN_RESTAURANTE } from '../../helpers/role-constants.js';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const roles = req.userRoles || [];
    const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null;
    
    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

/* ─────────────────────────────────────────────
   POST /analytics/reviews — Publicar reseña
─────────────────────────────────────────────── */
export const crearReview = async (req, res) => {
    try {
        const { usuarioId, username, restauranteId, platoId, rating, comentario, consumo } = req.body;

        if (!usuarioId || !restauranteId || !platoId) {
            return res.status(400).json({
                success: false,
                message: 'Los campos usuarioId, restauranteId y platoId son obligatorios'
            });
        }

        const nuevaReview = new Review({
            usuarioId: usuarioId.toString(),
            username: username || 'Usuario',
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
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/reviews/plato/:platoId
─────────────────────────────────────────────── */
export const getReviewsPorPlato = async (req, res) => {
    try {
        const { platoId } = req.params;

        const reviews = await Review.find({ 
            platoId: new mongoose.Types.ObjectId(platoId), 
            estado: 'activa' 
        }).sort({ createdAt: -1 }).lean();

        const totalReviews = reviews.length;
        const promedioRating = totalReviews > 0
            ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews)
            : 0;

        return res.status(200).json({
            success: true,
            data: {
                platoId,
                totalReviews,
                promedioRating: parseFloat(promedioRating.toFixed(1)),
                reviews
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * GET /analytics/reviews/restaurant/:restauranteId
 * Obtiene el resumen de reseñas de un restaurante y de todos sus platos
 */
export const getReviewsPorRestaurante = async (req, res) => {
    try {
        const { restauranteId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(restauranteId)) {
            return res.status(400).json({ success: false, message: 'ID de restaurante inválido' });
        }

        const stats = await Review.aggregate([
            { 
                $match: { 
                    restauranteId: new mongoose.Types.ObjectId(restauranteId), 
                    estado: 'activa' 
                } 
            },
            {
                $facet: {
                    overall: [
                        { 
                            $group: { 
                                _id: null, 
                                promedioRating: { $avg: '$rating' }, 
                                totalReviews: { $sum: 1 } 
                            } 
                        }
                    ],
                    perProduct: [
                        { 
                            $group: { 
                                _id: '$platoId', 
                                promedioRating: { $avg: '$rating' }, 
                                totalReviews: { $sum: 1 } 
                            } 
                        }
                    ]
                }
            }
        ]);

        const overall = stats[0].overall[0] || { promedioRating: 0, totalReviews: 0 };
        const perProduct = stats[0].perProduct || [];

        // Obtener todas las reseñas detalladas para el restaurante
        const reviews = await Review.find({ 
            restauranteId: new mongoose.Types.ObjectId(restauranteId), 
            estado: 'activa' 
        }).sort({ createdAt: -1 }).lean();

        return res.status(200).json({
            success: true,
            data: {
                restauranteId,
                totalReviews: overall.totalReviews,
                promedioRating: parseFloat((overall.promedioRating || 0).toFixed(1)),
                reviews,
                products: perProduct.map(p => ({
                    platoId: p._id,
                    promedioRating: parseFloat((p.promedioRating || 0).toFixed(1)),
                    totalReviews: p.totalReviews
                }))
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   PUT /analytics/reviews/:id
─────────────────────────────────────────────── */
export const updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comentario } = req.body;
        const userId = req.userId;

        const review = await Review.findById(id);
        if (!review || review.estado !== 'activa') {
            return res.status(404).json({ success: false, message: 'Reseña no encontrada' });
        }

        if (review.usuarioId !== userId.toString()) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        if (rating) review.rating = Number(rating);
        if (comentario) review.comentario = comentario.trim();

        await review.save();
        return res.status(200).json({ success: true, data: review });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   DELETE /analytics/reviews/:id
─────────────────────────────────────────────── */
export const deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        const review = await Review.findById(id);
        if (!review) return res.status(404).json({ success: false, message: 'Reseña no encontrada' });

        const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
        if (review.usuarioId !== userId.toString() && !isSystemAdmin) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        review.estado = 'eliminada';
        await review.save();
        return res.status(200).json({ success: true, message: 'Eliminada' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/platos/mas-vendidos (MS20)
─────────────────────────────────────────────── */
export const getPlatosMasVendidos = async (req, res) => {
    try {
        const limite = parseInt(req.query.limite) || 10;
        const { restauranteId } = req.query;
        const matchStage = { status: { $ne: 'cancelado' } };
        
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null) {
            if (restauranteId) {
                if (!ownedIds.some(id => id.toString() === restauranteId)) {
                    return res.status(403).json({ success: false, message: 'No autorizado' });
                }
                matchStage.restaurantId = new mongoose.Types.ObjectId(restauranteId);
            } else {
                matchStage.restaurantId = { $in: ownedIds };
            }
        } else if (restauranteId) {
            matchStage.restaurantId = new mongoose.Types.ObjectId(restauranteId);
        }

        const aggregationPipeline = [
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    nombrePlato: { $first: '$items.name' },
                    cantidadVendida: { $sum: '$items.quantity' },
                    ingresosGenerados: { $sum: '$items.subtotal' }
                }
            }
        ];

        const [locales, externas] = await Promise.all([
            Order.aggregate(aggregationPipeline),
            ExternalOrder.aggregate(aggregationPipeline)
        ]);

        const map = new Map();
        [...locales, ...externas].forEach(item => {
            const id = item._id.toString();
            if (map.has(id)) {
                const ex = map.get(id);
                ex.cantidadVendida += item.cantidadVendida;
                ex.ingresosGenerados += item.ingresosGenerados;
            } else {
                map.set(id, { ...item });
            }
        });

        const data = Array.from(map.values()).sort((a,b) => b.cantidadVendida - a.cantidadVendida).slice(0, limite);
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/stats — Estadísticas Globales
─────────────────────────────────────────────── */
export const getStatsAdmin = async (req, res) => {
    try {
        const matchStage = { status: { $ne: 'cancelado' } };
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null) matchStage.restaurantId = { $in: ownedIds };

        const pipeline = [{ $match: matchStage }, { $group: { _id: null, totalIngresos: { $sum: '$total' }, totalPedidos: { $sum: 1 } } }];
        const [sL, sE, countR] = await Promise.all([
            Order.aggregate(pipeline),
            ExternalOrder.aggregate(pipeline),
            Restaurant.countDocuments(ownedIds !== null ? { _id: { $in: ownedIds }, isActive: true } : { isActive: true })
        ]);

        const local = sL[0] || { totalIngresos: 0, totalPedidos: 0 };
        const externa = sE[0] || { totalIngresos: 0, totalPedidos: 0 };
        const tI = local.totalIngresos + externa.totalIngresos;
        const tP = local.totalPedidos + externa.totalPedidos;

        return res.status(200).json({
            success: true,
            data: {
                ingresosTotales: tI,
                pedidosTotales: tP,
                ticketPromedio: tP > 0 ? parseFloat((tI / tP).toFixed(2)) : 0,
                restaurantesTotales: countR
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/stats/restaurant/:restaurantId
─────────────────────────────────────────────── */
export const getStatsByRestaurant = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(id => id.toString() === restaurantId)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const match = { restaurantId: new mongoose.Types.ObjectId(restaurantId), status: { $ne: 'cancelado' } };
        const topPipe = [{ $match: match }, { $unwind: '$items' }, { $group: { _id: '$items.productId', nombre: { $first: '$items.name' }, cantidadVendida: { $sum: '$items.quantity' }, ingresos: { $sum: '$items.subtotal' } } }];

        const [sL, sE, tL, tE, revS] = await Promise.all([
            Order.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            ExternalOrder.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            Order.aggregate(topPipe),
            ExternalOrder.aggregate(topPipe),
            Review.aggregate([{ $match: { restauranteId: new mongoose.Types.ObjectId(restaurantId), estado: 'activa' } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }])
        ]);

        const l = sL[0] || { total: 0, count: 0 };
        const e = sE[0] || { total: 0, count: 0 };
        const r = revS[0] || { avg: 0, count: 0 };
        const tI = l.total + e.total;
        const tP = l.count + e.count;

        const map = new Map();
        [...tL, ...tE].forEach(i => {
            const id = i._id.toString();
            if (map.has(id)) {
                const ex = map.get(id);
                ex.cantidadVendida += i.cantidadVendida;
                ex.ingresos += i.ingresos;
            } else map.set(id, { ...i });
        });

        return res.status(200).json({
            success: true,
            data: {
                ingresosTotales: tI,
                pedidosTotales: tP,
                ticketPromedio: tP > 0 ? parseFloat((tI / tP).toFixed(2)) : 0,
                promedioRating: parseFloat(r.avg.toFixed(1)),
                totalReviews: r.count,
                topProductos: Array.from(map.values()).sort((a,b) => b.cantidadVendida - a.cantidadVendida).slice(0, 5)
            }
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/chart-data
─────────────────────────────────────────────── */
export const getSalesChartData = async (req, res) => {
    try {
        const { restauranteId } = req.query;
        const days = parseInt(req.query.days) || 7;
        const start = new Date();
        start.setHours(0,0,0,0);
        start.setDate(start.getDate() - days);

        const match = { createdAt: { $gte: start }, status: { $ne: 'cancelado' } };
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null) {
            if (restauranteId) match.restaurantId = new mongoose.Types.ObjectId(restauranteId);
            else match.restaurantId = { $in: ownedIds };
        } else if (restauranteId) match.restaurantId = new mongoose.Types.ObjectId(restauranteId);

        const pipe = [{ $match: match }, { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, sales: { $sum: "$total" }, orders: { $sum: 1 } } }];
        const [dL, dE] = await Promise.all([Order.aggregate(pipe), ExternalOrder.aggregate(pipe)]);

        const map = new Map();
        [...dL, ...dE].forEach(i => {
            if (map.has(i._id)) {
                const ex = map.get(i._id);
                ex.sales += i.sales;
                ex.orders += i.orders;
            } else map.set(i._id, { ...i });
        });

        const data = Array.from(map.values()).sort((a,b) => a._id.localeCompare(b._id)).map(i => ({ name: i._id, sales: parseFloat(i.sales.toFixed(2)), orders: i.orders }));
        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
