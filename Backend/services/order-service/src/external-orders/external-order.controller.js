'use strict';

import ExternalOrder from './external-order.model.js';
import Product from '../product/products-model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { sendInvoiceEmail } from '../../helpers/email-service.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

// ─── TRANSICIONES DE ESTADO POR TIPO ───────────────────────────────────────────
const STATUS_TRANSITIONS = {
  domicilio: {
    recibido:        ['confirmado', 'cancelado'], // Se puede cancelar solo en recibido
    confirmado:      ['en_preparacion'],
    en_preparacion:  ['listo'],
    listo:           ['en_camino'],
    en_camino:       ['entregado']
  },
  para_llevar: {
    recibido:       ['confirmado', 'cancelado'], // Se puede cancelar en cualquier paso previo a la entrega
    confirmado:     ['en_preparacion', 'cancelado'],
    en_preparacion: ['listo', 'cancelado'],
    listo:          ['entregado', 'cancelado']
  }
};

// ─── CREAR PEDIDO EXTERNO ───────────────────────────────────────────────────────
export const createExternalOrder = async (req, res) => {
  try {
    const { restaurantId, orderType, deliveryAddress, customerNote, items, deliveryFee } = req.body;
    const userId = req.userId;

    if (!orderType || !['domicilio', 'para_llevar'].includes(orderType)) {
      return res.status(400).json({ message: "orderType debe ser 'domicilio' o 'para_llevar'" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }

    if (orderType === 'domicilio') {
      if (!deliveryAddress?.street || !deliveryAddress?.phone) {
        return res.status(400).json({ message: "Se requiere calle y teléfono para domicilio" });
      }
    }

    let total = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: 'Producto no encontrado' });

      const subtotal = product.price * item.quantity;
      total += subtotal;

      processedItems.push({
        productId: product._id,
        name:      product.name,
        quantity:  item.quantity,
        price:     product.price,
        subtotal
      });

      // Descontar inventario
      for (const ingredient of product.ingredients) {
        const inventoryItem = await InventoryItem.findOne({
          where: { RestaurantId: restaurantId, Name: ingredient.name }
        });
        if (inventoryItem) {
          const ingredientQty = parseFloat(ingredient.quantity) || 1;
          inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) - (ingredientQty * item.quantity);
          await inventoryItem.save();
        }
      }
    }

    const fee = orderType === 'para_llevar' ? 0 : (parseFloat(deliveryFee) || 0);
    const newOrder = new ExternalOrder({
      restaurantId, userId, orderType,
      deliveryAddress: orderType === 'domicilio' ? deliveryAddress : undefined,
      customerNote:    customerNote || '',
      items:           processedItems,
      total:           total + fee,
      deliveryFee:     fee
    });

    await newOrder.save();
    return res.status(201).json({ success: true, order: newOrder });

  } catch (error) {
    return res.status(500).json({ message: "Error al crear", error: error.message });
  }
};

// ─── CANCELAR PEDIDO EXTERNO (Dueño/Admin) ──────────────────────────────────────
export const cancelExternalOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await ExternalOrder.findById(id);

    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Reutilizamos la lógica de validación de cancelación que definimos
    if (order.orderType === 'domicilio' && order.status !== 'recibido') {
      return res.status(400).json({ message: "Solo se pueden cancelar domicilios en estado 'recibido'." });
    }
    if (order.status === 'entregado') {
      return res.status(400).json({ message: "No se puede cancelar un pedido ya entregado." });
    }

    order.status = 'cancelado';
    await order.save();

    return res.json({ success: true, message: 'Pedido cancelado correctamente', order });

  } catch (error) {
    return res.status(500).json({ message: "Error al cancelar", error: error.message });
  }
};

// ─── AVANZAR/ACTUALIZAR ESTADO (Admin) ──────────────────────────────────────────
export const updateExternalOrderStatus = async (req, res) => {
  try {
    const { id }    = req.params;
    const { status } = req.body;

    const order = await ExternalOrder.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    // Regla de Negocio: Cancelación
    if (status === 'cancelado') {
      if (order.orderType === 'domicilio' && order.status !== 'recibido') {
        return res.status(400).json({ 
          message: "Los pedidos a domicilio solo pueden cancelarse mientras están en estado 'recibido'." 
        });
      }
      if (order.status === 'entregado') {
        return res.status(400).json({ message: "No se puede cancelar un pedido ya entregado." });
      }
    } else {
      // Validación de transición normal
      const validTransitions = STATUS_TRANSITIONS[order.orderType][order.status] || [];
      if (!validTransitions.includes(status)) {
        return res.status(400).json({ 
          message: `Transición inválida. De '${order.status}' no se puede pasar a '${status}'.` 
        });
      }
    }

    order.status = status;
    await order.save();

    return res.json({ success: true, order });

  } catch (error) {
    return res.status(500).json({ message: "Error al actualizar", error: error.message });
  }
};

export const getRestaurantExternalOrders = async (req, res) => {
    try {
        const { restaurantId } = req.query;
        if (!restaurantId) return res.status(400).json({ message: 'restaurantId es requerido' });
        const orders = await ExternalOrder.find({ restaurantId }).sort({ createdAt: -1 });
        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getExternalOrderHistory = async (req, res) => {
    try {
        const orders = await ExternalOrder.find({ userId: req.userId }).sort({ createdAt: -1 });
        return res.json({ orders });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getExternalOrderById = async (req, res) => {
    try {
        const order = await ExternalOrder.findById(req.params.id);
        return res.json({ order });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

export const getExternalOrderInvoice = async (req, res) => {
    // Implementación simplificada para el ejemplo
    return res.json({ message: "Factura generada" });
};
