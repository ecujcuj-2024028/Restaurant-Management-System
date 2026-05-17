import ExternalOrder from './external-order.model.js';
import Product from '../product/products-model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import mongoose from 'mongoose';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const roles = req.userRoles || [];
    const isSystemAdmin = roles.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = roles.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) return []; // Otros roles

    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

export const createExternalOrder = async (req, res) => {
    try {
        const { restaurantId, items, customerName, address, phone } = req.body;
        const userId = req.userId;

        let total = 0;
        const processedItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || !product.isActive || !product.isAvailable) {
                return res.status(400).json({ message: "Producto no disponible" });
            }

            const subtotal = product.price * item.quantity;
            total += subtotal;

            processedItems.push({
                productId: product._id,
                name: product.name,
                quantity: item.quantity,
                price: product.price,
                subtotal
            });
        }

        const newOrder = new ExternalOrder({
            restaurantId,
            userId,
            customerName,
            address,
            phone,
            items: processedItems,
            total
        });

        await newOrder.save();

        return res.status(201).json({
            success: true,
            message: "Pedido externo creado correctamente",
            order: newOrder
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const cancelExternalOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await ExternalOrder.findById(id);

        if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

        // SEGURIDAD: Solo dueño de pedido o dueño de restaurante
        const ownedIds = await getOwnedRestaurantIds(req);
        const isRestaurantOwner = ownedIds && ownedIds.some(oid => oid.toString() === order.restaurantId.toString());
        const isCustomerOwner = order.userId === req.userId;

        if (ownedIds !== null && !isRestaurantOwner && !isCustomerOwner) {
            return res.status(403).json({ message: "No autorizado" });
        }

        order.status = 'cancelado';
        await order.save();

        return res.json({ success: true, message: "Pedido cancelado", order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const updateExternalOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await ExternalOrder.findById(id);
        if (!order) return res.status(404).json({ message: "Pedido no encontrado" });

        // SEGURIDAD: Validar propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null && !ownedIds.some(oid => oid.toString() === order.restaurantId.toString())) {
            return res.status(403).json({ success: false, message: 'No autorizado para este restaurante' });
        }

        order.status = status;
        await order.save();

        return res.json({ success: true, message: "Estado actualizado", order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getRestaurantExternalOrders = async (req, res) => {
    try {
        const { restaurantId, status } = req.query;
        const filter = {};

        // SEGURIDAD: Filtrar por propiedad
        const ownedIds = await getOwnedRestaurantIds(req);
        if (ownedIds !== null) {
            if (restaurantId) {
                if (!ownedIds.some(id => id.toString() === restaurantId)) {
                    return res.status(403).json({ success: false, message: 'No tienes permiso para ver este restaurante' });
                }
                filter.restaurantId = restaurantId;
            } else {
                filter.restaurantId = { $in: ownedIds };
            }
        } else if (restaurantId) {
            filter.restaurantId = restaurantId;
        }

        if (status) filter.status = status;

        const orders = await ExternalOrder.find(filter).sort({ createdAt: -1 });
        return res.json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getExternalOrderHistory = async (req, res) => {
    try {
        const orders = await ExternalOrder.find({ userId: req.userId }).sort({ createdAt: -1 });
        return res.json({ success: true, orders });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getExternalOrderById = async (req, res) => {
    try {
        const order = await ExternalOrder.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "No encontrado" });

        // SEGURIDAD
        const ownedIds = await getOwnedRestaurantIds(req);
        const isRestaurantOwner = ownedIds && ownedIds.some(oid => oid.toString() === order.restaurantId.toString());
        const isCustomerOwner = order.userId === req.userId;

        if (ownedIds !== null && !isRestaurantOwner && !isCustomerOwner) {
            return res.status(403).json({ message: "No autorizado" });
        }

        return res.json({ success: true, order });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getExternalOrderInvoice = async (req, res) => {
    // ... lógica similar a getInvoice de órdenes normales ...
    return res.status(501).json({ message: "Not implemented yet" });
};
