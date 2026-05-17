import Order from './order.model.js';
import Product from '../product/products-model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Reservation from '../reservations/reservation.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { sendInvoiceEmail } from '../../helpers/email-service.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';
import mongoose from 'mongoose';

/* ─────────────────────────────────────────────
   Helper: obtener IDs de restaurantes propios
─────────────────────────────────────────────── */
const getOwnedRestaurantIds = async (req) => {
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    const isRestauranteAdmin = req.userRoles?.includes(ADMIN_RESTAURANTE);

    if (isSystemAdmin) return null; // Acceso total
    if (!isRestauranteAdmin) return []; // Otros roles no ven nada o solo lo suyo

    const myRestaurants = await Restaurant.find({ ownerId: req.userId, isActive: true }, '_id');
    return myRestaurants.map(r => r._id);
};

export const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tableId, tableNumber, items, restaurantId } = req.body;
    const userId = req.userId;
    const userRoles = req.userRoles || [];
    const isClient = !userRoles.some(r => r === ADMIN_SISTEMA || r === ADMIN_RESTAURANTE);

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }

    // ── VALIDACIÓN DE RESERVA PARA CLIENTES ──────────────────────────────────
    if (isClient) {
      const restaurant = await Restaurant.findById(restaurantId);
      const restaurantPhone = restaurant?.phone || 'el establecimiento';

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      const activeReservation = await Reservation.findOne({
        where: {
          userId,
          restaurantId,
          tableId,
          date: today,
          status: 'confirmada'
        },
        transaction: t
      });

      if (!activeReservation) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: `Primero debes tener una reservación confirmada en esta mesa para hoy. Si deseas pedir a domicilio, contacta al restaurante al: ${restaurantPhone}`
        });
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    let total = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive || !product.isAvailable) {
        await t.rollback();
        return res.status(400).json({ message: `Producto inválido o no disponible` });
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

      for (const ingredient of product.ingredients) {
        const inventoryItem = await InventoryItem.findOne({
          where: {
            RestaurantId: restaurantId,
            Name: ingredient.name
          },
          transaction: t
        });

        if (!inventoryItem) {
          await t.rollback();
          return res.status(400).json({
            message: `No existe inventario para el insumo: ${ingredient.name}`
          });
        }

        const ingredientQty = parseFloat(ingredient.quantity) || 1;

        if (parseFloat(inventoryItem.Quantity) < ingredientQty * item.quantity) {
          await t.rollback();
          return res.status(400).json({
            message: `Stock insuficiente para ${ingredient.name}. Disponible: ${inventoryItem.Quantity}`
          });
        }

        inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) - (ingredientQty * item.quantity);
        await inventoryItem.save({ transaction: t });

        if (parseFloat(inventoryItem.Quantity) <= parseFloat(inventoryItem.MinStock)) {
          console.log(`ALERTA: Stock crítico de ${inventoryItem.Name}. Nivel actual: ${inventoryItem.Quantity}`);
        }
      }
    }

    const newOrder = new Order({
      restaurantId,
      userId,
      tableNumber,
      items: processedItems,
      total
    });

    await newOrder.save();
    await t.commit();

    return res.status(201).json({
      message: "Pedido creado correctamente",
      order: newOrder
    });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error al crear el pedido",
      error: error.message
    });
  }
};

export const cancelOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (!['recibido', 'en_preparacion'].includes(order.status)) {
      await t.rollback();
      return res.status(400).json({ message: "No se puede cancelar este pedido" });
    }

    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;
      for (const ingredient of product.ingredients) {
        const inventoryItem = await InventoryItem.findOne({
          where: {
            RestaurantId: order.restaurantId.toString(),
            Name: ingredient.name
          },
          transaction: t
        });

        if (inventoryItem) {
          const ingredientQty = parseFloat(ingredient.quantity) || 1;
          inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) + (ingredientQty * item.quantity);
          await inventoryItem.save({ transaction: t });
        }
      }
    }

    order.status = 'cancelado';
    await order.save();
    await t.commit();

    return res.json({ message: "Pedido cancelado correctamente", order });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({
      message: "Error al cancelar pedido",
      error: error.message
    });
  }
};

export const getOrderHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({ page, limit, orders, reservations: [] });
  } catch (error) {
    console.error('Error getOrderHistory:', error.message);
    return res.status(500).json({
      message: "Error al obtener historial",
      error: error.message
    });
  }
};

// ─── GESTIÓN DE ESTADOS ────────────────────────────────────────────────────────

const STATUS_TRANSITIONS = {
  recibido: 'en_preparacion',
  en_preparacion: 'listo',
  listo: 'entregado',
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'El campo status es requerido' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // SEGURIDAD: Validar propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds && !ownedIds.some(oid => oid.toString() === order.restaurantId.toString())) {
        return res.status(403).json({ success: false, message: 'No autorizado para este pedido' });
    }

    const validNext = STATUS_TRANSITIONS[order.status];

    if (!validNext) {
      return res.status(400).json({
        message: `El pedido está en estado '${order.status}' y no puede avanzar`,
      });
    }

    if (status !== validNext) {
      return res.status(400).json({
        message: `Transición inválida. De '${order.status}' solo se puede pasar a '${validNext}'`,
      });
    }

    order.status = status;
    await order.save();

    return res.json({ message: 'Estado actualizado correctamente', order });
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId, status } = req.query;
    const filter = {};

    // SEGURIDAD: Filtrar por propiedad
    const ownedIds = await getOwnedRestaurantIds(req);
    if (ownedIds) {
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

    const orders = await Order.find(filter).sort({ createdAt: -1 });

    return res.json({ orders });
  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
  }
};

// ─── FACTURACIÓN ───────────────────────────────────────────────────────────────
export const getInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const authenticatedUserId = req.userId;

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

        // SEGURIDAD: Validar propiedad o autoría
        const ownedIds = await getOwnedRestaurantIds(req);
        const isOwnerOfRestaurant = ownedIds && ownedIds.some(oid => oid.toString() === order.restaurantId.toString());
        const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
        const isCustomerOwner = order.userId?.toString() === authenticatedUserId?.toString();

        if (!isSystemAdmin && !isOwnerOfRestaurant && !isCustomerOwner) {
            return res.status(403).json({ success: false, message: 'No tienes permiso.' });
        }

        if (order.status !== 'entregado') {
            return res.status(400).json({ success: false, message: 'Pedido no entregado.' });
        }

        const restaurant = await Restaurant.findById(order.restaurantId);
        const customer = isCustomerOwner ? req.user : { Name: 'Cliente', Surname: 'Registrado', Email: null };

        const invoiceParams = {
            customerEmail: customer?.Email,
            customerName: customer ? `${customer.Name} ${customer.Surname}` : 'Cliente',
            invoiceNumber: order._id.toString().slice(-8).toUpperCase(),
            date: new Date(order.updatedAt).toLocaleString('es-GT', { dateStyle: 'long' }),
            restaurantName: restaurant?.name || 'GastroManager',
            tableNumber: order.tableNumber || 'N/A',
            items: order.items.map(i => ({
                name: i.name,
                quantity: i.quantity,
                price: Number(i.price),
                subtotal: Number(i.subtotal)
            })),
            total: Number(order.total)
        };

        if (!order.invoiceGenerated) {
            order.invoiceGenerated = true;
            await order.save();
        }

        if (invoiceParams.customerEmail) {
            sendInvoiceEmail(invoiceParams).catch(err => 
                console.error('Error enviando correo:', err)
            );
        }

        return res.status(200).json({
            success: true,
            message: 'Factura generada y enviada',
            invoice: {
                ...invoiceParams,
                total: `Q ${invoiceParams.total.toFixed(2)}`
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
    }
};
