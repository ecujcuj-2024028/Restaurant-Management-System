import { Review } from './review.model.js';
import Order from '../orders/order.model.js';
import ExternalOrder from '../orders/external-order.model.js';
import mongoose from 'mongoose';

/* ─────────────────────────────────────────────
   POST /analytics/reviews — Publicar reseña
─────────────────────────────────────────────── */
export const crearReview = async (req, res) => {
    try {
        const { usuarioId, restauranteId, platoId, rating, comentario, consumo } = req.body;

        if (!usuarioId || !restauranteId || !platoId) {
            return res.status(400).json({
                success: false,
                message: 'Los campos usuarioId, restauranteId y platoId son obligatorios'
            });
        }

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'El rating debe ser entre 1 y 5' });
        }

        if (!comentario || comentario.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'El comentario debe tener al menos 10 caracteres' });
        }

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
        if (restauranteId && mongoose.Types.ObjectId.isValid(restauranteId)) {
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

        // Obtener datos de ambas colecciones
        const [ordenesLocales, ordenesExternas] = await Promise.all([
            Order.aggregate(aggregationPipeline),
            ExternalOrder.aggregate(aggregationPipeline)
        ]);

        // Combinar resultados
        const combinedMap = new Map();

        [...ordenesLocales, ...ordenesExternas].forEach(item => {
            const id = item._id.toString();
            if (combinedMap.has(id)) {
                const existing = combinedMap.get(id);
                existing.cantidadVendida += item.cantidadVendida;
                existing.ingresosGenerados += item.ingresosGenerados;
            } else {
                combinedMap.set(id, { ...item });
            }
        });

        const resultado = Array.from(combinedMap.values())
            .sort((a, b) => b.cantidadVendida - a.cantidadVendida)
            .slice(0, limite);

        return res.status(200).json({
            success: true,
            message: `Top ${limite} platos con ventas locales y externas`,
            data: resultado
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/stats — Estadísticas Globales
─────────────────────────────────────────────── */
export const getStatsAdmin = async (req, res) => {
    try {
        const pipeline = [
            { $match: { status: { $ne: 'cancelado' } } },
            {
                $group: {
                    _id: null,
                    totalIngresos: { $sum: '$total' },
                    totalPedidos: { $sum: 1 }
                }
            }
        ];

        const [statsLocales, statsExternas] = await Promise.all([
            Order.aggregate(pipeline),
            ExternalOrder.aggregate(pipeline)
        ]);

        const local = statsLocales[0] || { totalIngresos: 0, totalPedidos: 0 };
        const externa = statsExternas[0] || { totalIngresos: 0, totalPedidos: 0 };

        const totalIngresos = local.totalIngresos + externa.totalIngresos;
        const totalPedidos = local.totalPedidos + externa.totalPedidos;
        const ticketPromedio = totalPedidos > 0 ? (totalIngresos / totalPedidos) : 0;

        return res.status(200).json({
            success: true,
            message: 'Estadísticas globales (Locales + Externas)',
            data: {
                ingresosTotales: totalIngresos,
                pedidosTotales: totalPedidos,
                ticketPromedio: parseFloat(ticketPromedio.toFixed(2))
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

        if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
            return res.status(400).json({
                success: false,
                message: 'ID de restaurante inválido'
            });
        }

        const matchStage = {
            restaurantId: new mongoose.Types.ObjectId(restaurantId),
            status: { $ne: 'cancelado' }
        };

        const topProductsPipeline = [
            { $match: matchStage },
            { $unwind: '$items' },
            {
                $group: {
                    _id            : '$items.productId',
                    nombre         : { $first: '$items.name' },
                    cantidadVendida: { $sum: '$items.quantity' },
                    ingresos       : { $sum: '$items.subtotal' }
                }
            }
        ];

        const [localStats, externaStats, localTop, externaTop, localStates, externaStates, reviewStats] = await Promise.all([
            Order.aggregate([{ $match: matchStage }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            ExternalOrder.aggregate([{ $match: matchStage }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
            Order.aggregate(topProductsPipeline),
            ExternalOrder.aggregate(topProductsPipeline),
            Order.aggregate([{ $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
            ExternalOrder.aggregate([{ $match: { restaurantId: new mongoose.Types.ObjectId(restaurantId) } }, { $group: { _id: '$status', total: { $sum: 1 } } }]),
            Review.aggregate([
                { $match: { restauranteId: new mongoose.Types.ObjectId(restaurantId), estado: 'activa' } },
                { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
            ])
        ]);

        const lRes = localStats[0] || { total: 0, count: 0 };
        const eRes = externaStats[0] || { total: 0, count: 0 };
        const rRes = reviewStats[0] || { avg: 0, count: 0 };

        const totalIngresos = lRes.total + eRes.total;
        const totalPedidos = lRes.count + eRes.count;
        const ticketPromedio = totalPedidos > 0 ? (totalIngresos / totalPedidos) : 0;

        // Combinar Top Productos
        const topMap = new Map();
        [...localTop, ...externaTop].forEach(item => {
            const id = item._id.toString();
            if (topMap.has(id)) {
                const ex = topMap.get(id);
                ex.cantidadVendida += item.cantidadVendida;
                ex.ingresos += item.ingresos;
            } else {
                topMap.set(id, { ...item });
            }
        });
        const topProductos = Array.from(topMap.values()).sort((a,b) => b.cantidadVendida - a.cantidadVendida).slice(0, 5);

        // Combinar Estados
        const stateMap = new Map();
        [...localStates, ...externaStates].forEach(s => {
            stateMap.set(s._id, (stateMap.get(s._id) || 0) + s.total);
        });
        const estadosPedidos = Array.from(stateMap.entries()).map(([k, v]) => ({ _id: k, total: v }));

        return res.status(200).json({
            success: true,
            restaurantId,
            data: {
                ingresosTotales: totalIngresos,
                pedidosTotales : totalPedidos,
                ticketPromedio : parseFloat(ticketPromedio.toFixed(2)),
                promedioRating : parseFloat(rRes.avg.toFixed(2)),
                totalReviews   : rRes.count,
                topProductos,
                estadosPedidos
            }
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/* ─────────────────────────────────────────────
   GET /analytics/chart-data — Datos para Gráfica
─────────────────────────────────────────────── */
export const getSalesChartData = async (req, res) => {
    try {
        const { restauranteId } = req.query;
        const days = parseInt(req.query.days) || 7;
        
        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        startDate.setDate(startDate.getDate() - days);

        const matchStage = { 
            createdAt: { $gte: startDate }, 
            status: { $ne: 'cancelado' } 
        };

        if (restauranteId && mongoose.Types.ObjectId.isValid(restauranteId)) {
            matchStage.restaurantId = new mongoose.Types.ObjectId(restauranteId);
        }

        const pipeline = [
            { $match: matchStage },
            { 
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    sales: { $sum: "$total" },
                    orders: { $sum: 1 }
                }
            }
        ];

        const [localData, externaData] = await Promise.all([
            Order.aggregate(pipeline),
            ExternalOrder.aggregate(pipeline)
        ]);

        // Combinar por fecha
        const combinedMap = new Map();
        
        const process = (arr) => {
            arr.forEach(item => {
                if (combinedMap.has(item._id)) {
                    const existing = combinedMap.get(item._id);
                    existing.sales += item.sales;
                    existing.orders += item.orders;
                } else {
                    combinedMap.set(item._id, { ...item });
                }
            });
        };

        process(localData);
        process(externaData);

        const data = Array.from(combinedMap.values())
            .sort((a, b) => a._id.localeCompare(b._id))
            .map(item => ({
                name: item._id,
                sales: parseFloat(item.sales.toFixed(2)),
                orders: item.orders
            }));

        return res.status(200).json({
            success: true,
            message: `Datos combinados de ventas de los últimos ${days} días`,
            data
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};