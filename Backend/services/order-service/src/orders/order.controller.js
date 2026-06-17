import Order from './order.model.js';
import Product from '../product/products-model.js';
import Menu from '../menu/menu.model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Reservation from '../reservations/reservation.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { sendInvoiceEmail } from '../../helpers/email-service.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';
import mongoose from 'mongoose';
import axios from 'axios';

const GATEWAY_INTERNAL_URL = process.env.GATEWAY_INTERNAL_URL || 'http://api_gateway:3000/restaurantManagement/v1/internal/emit';
const NOTIFICATIONS_INTERNAL_URL = process.env.NOTIFICATIONS_INTERNAL_URL || 'http://api_gateway:3000/restaurantManagement/v1/notifications/internal/create';

// Helper para crear notificaciones persistentes
const createPersistentNotification = async (data) => {
  try {
    await axios.post(NOTIFICATIONS_INTERNAL_URL, data);
  } catch (err) {
    console.error('[NotificationError] Error creating persistent notification:', err.message);
  }
};

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
      return res.status(400).json({ message: "Debe enviar al menos un producto o menú" });
    }

    // ── VALIDACIÓN DE RESERVA PARA CLIENTES ──────────────────────────────────
    if (isClient) {
      const today = new Date().toISOString().split('T')[0]; 
      
      // Obtener todas las reservaciones confirmadas del usuario para hoy en este restaurante y mesa
      const activeReservations = await Reservation.findAll({
        where: { userId, restaurantId, tableId, date: today, status: 'confirmada' },
        transaction: t
      });

      if (!activeReservations || activeReservations.length === 0) {
        await t.rollback();
        return res.status(403).json({
          success: false,
          message: `No tienes una reservación confirmada en esta mesa para hoy.`
        });
      }

      // Validar ventana de tiempo (2 horas desde la hora de la reserva)
      const now = new Date();
      const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      const isWithinWindow = activeReservations.some(res => {
          const [resH, resM] = res.time.split(':').map(Number);
          const resTime = new Date();
          resTime.setHours(resH, resM, 0, 0);
          
          const endTime = new Date(resTime.getTime() + 120 * 60000); // +2 horas
          const endHHMM = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;
          
          return currentHHMM >= res.time && currentHHMM <= endHHMM;
      });

      if (!isWithinWindow) {
          await t.rollback();
          return res.status(403).json({
              success: false,
              message: `Tu reservación no está activa en este momento. Solo puedes pedir durante las 2 horas de tu reserva (${activeReservations[0].time}).`
          });
      }
    }

    let total = 0;
    const processedItems = [];

    for (const item of items) {
      if (item.isMenu || item.menuId) {
        // PROCESAR COMO MENÚ (COMBO/OFERTA)
        const menuId = item.menuId || item.productId; // Soporta ambos por compatibilidad
        const menu = await Menu.findById(menuId).populate('items.product');

        if (!menu || !menu.isActive) {
          await t.rollback();
          return res.status(400).json({ message: `El menú ${menuId} no está disponible` });
        }

        // Usar precio del menú si existe, sino sumar productos
        const menuPrice = menu.price || menu.items.reduce((sum, i) => sum + (i.product?.price || 0), 0);
        const subtotal = menuPrice * item.quantity;
        total += subtotal;

        processedItems.push({
          menuId: menu._id,
          isMenu: true,
          name: menu.name,
          quantity: item.quantity,
          price: menuPrice,
          subtotal
        });

        // Descontar stock de cada producto dentro del menú
        for (const menuItem of menu.items) {
          const product = menuItem.product;
          if (product && product.ingredients) {
            await processStockDeduction(product, item.quantity, restaurantId, t);
          }
        }
      } else {
        // PROCESAR COMO PRODUCTO INDIVIDUAL
        const product = await Product.findById(item.productId);

        if (!product || !product.isActive || !product.isAvailable) {
          await t.rollback();
          return res.status(400).json({ message: `Producto ${item.productId} no disponible` });
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

        await processStockDeduction(product, item.quantity, restaurantId, t);
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

    // Poblar datos para que el Admin vea el pedido completo (nombres, etc)
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('restaurantId', 'name photos')
      .lean();

    // Notificar vía WebSockets al restaurante
    axios.post(GATEWAY_INTERNAL_URL, {
      event: 'order_created',
      data: populatedOrder || newOrder,
      room: `restaurant_${restaurantId}`
    }).catch(err => console.error('[SocketError] Error notifying creation:', err.message));

    return res.status(201).json({ success: true, message: "Pedido creado correctamente", order: newOrder });

  } catch (error) {
    await t.rollback();
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* Helper para descontar stock */
async function processStockDeduction(product, orderQuantity, restaurantId, transaction) {
    for (const ingredient of product.ingredients) {
      const inventoryItem = await InventoryItem.findOne({
        where: { RestaurantId: restaurantId, Name: ingredient.name },
        transaction
      });

      if (!inventoryItem) {
        throw new Error(`No hay stock registrado para: ${ingredient.name}`);
      }

      const ingredientQtyNeeded = (parseFloat(ingredient.quantity) || 1) * orderQuantity;

      if (parseFloat(inventoryItem.Quantity) < ingredientQtyNeeded) {
        throw new Error(`Stock insuficiente para ${ingredient.name}. Disponible: ${inventoryItem.Quantity}`);
      }

      inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) - ingredientQtyNeeded;
      await inventoryItem.save({ transaction });
    }
}

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

    // Notificar vía WebSockets
    axios.post(GATEWAY_INTERNAL_URL, {
      event: 'order_cancelled',
      data: order,
      room: `restaurant_${order.restaurantId}`
    }).catch(err => console.error('[SocketError] Error notifying cancellation:', err.message));

    // Notificar al usuario específico
    axios.post(GATEWAY_INTERNAL_URL, {
      event: 'order_cancelled',
      data: order,
      room: `user_${order.userId}`
    }).catch(() => {});

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
    const { restaurantId, startDate, endDate } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (restaurantId) filter.restaurantId = restaurantId;
    
    // Filtro por fecha
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const orders = await Order.find(filter)
      .populate('restaurantId', 'name photos')
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

const VALID_STATUSES = ['recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado'];

const STATUS_FLOW = {
  recibido: 'en_preparacion',
  en_preparacion: 'listo',
  listo: 'entregado',
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Estado inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}` 
      });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Pedido no encontrado' });
    }

    // SEGURIDAD: Validar propiedad (Admin Sistema pasa directo)
    const isSystemAdmin = req.userRoles?.includes(ADMIN_SISTEMA);
    if (!isSystemAdmin) {
        const ownedIds = await getOwnedRestaurantIds(req);
        const isRestaurantOwner = ownedIds && ownedIds.some(oid => oid.toString() === order.restaurantId.toString());
        if (!isRestaurantOwner) {
            return res.status(403).json({ success: false, message: 'No tienes permiso para gestionar este restaurante' });
        }
    }

    // Guardamos el estado anterior para logs o lógica futura
    const previousStatus = order.status;
    
    // Actualizamos el estado
    order.status = status;
    await order.save();

    // Intentar poblar restaurante para que el cliente no vea "Restaurante" genérico
    const populatedOrder = await Order.findById(id).populate('restaurantId', 'name photos');

    console.log(`[OrderService] Order ${id} updated from ${previousStatus} to ${status} by ${req.userId}`);

    // ... (statusMessages igual)
    const statusMessages = {
      recibido: "¡Recibimos tu pedido! Pronto empezaremos a prepararlo.",
      en_preparacion: "Tu pedido está en la cocina. ¡Ya se siente el aroma!",
      listo: "¡Prepárate! Ya casi llega tu pedido a la mesa.",
      entregado: "¡Buen provecho! Esperamos que te haya gustado.",
      cancelado: "Lo sentimos, tu pedido ha sido cancelado."
    }

    // Persistir notificación para el cliente
    createPersistentNotification({
      userId: order.userId,
      restaurantId: order.restaurantId,
      type: 'order',
      title: 'Actualización de Pedido',
      message: statusMessages[status] || `Tu pedido está: ${status}`,
      link: '/orders'
    });

    // Notificar vía WebSockets usando el objeto poblado
    axios.post(GATEWAY_INTERNAL_URL, {
      event: 'order_status_updated',
      data: populatedOrder || order,
      room: `restaurant_${order.restaurantId}`
    }).catch(err => console.error('[SocketError] Error notifying status update:', err.message));

    // Notificar al usuario específico
    axios.post(GATEWAY_INTERNAL_URL, {
      event: 'order_status_updated',
      data: populatedOrder || order,
      room: `user_${order.userId}`
    }).catch(() => {});

    return res.json({ 
      success: true, 
      message: 'Estado actualizado correctamente', 
      order 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al actualizar estado', error: error.message });
  }
};

export const getRestaurantOrders = async (req, res) => {
  try {
    const { restaurantId, status, startDate, endDate } = req.query;
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

    // Filtro por fecha
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

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
        
        let customerData = { Name: 'Cliente', Surname: 'Registrado', Email: null };
        
        // Intentar obtener datos reales del cliente desde identity-service
        if (order.userId) {
            try {
                const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity_service:3001/restaurantManagement/v1';
                const response = await axios.get(`${IDENTITY_SERVICE_URL}/users/${order.userId}`, {
                    headers: { 'Authorization': req.header('Authorization') }
                });
                if (response.data?.success) {
                    customerData = {
                        Name: response.data.user.name,
                        Surname: response.data.user.surname,
                        Email: response.data.user.email
                    };
                }
            } catch (err) {
                console.warn(`[InvoiceError] No se pudo obtener datos del cliente ${order.userId}:`, err.message);
                // Si el que solicita es el dueño del pedido, usamos sus datos de la sesión
                if (isCustomerOwner) {
                    customerData = {
                        Name: req.user.Name,
                        Surname: req.user.Surname,
                        Email: req.user.Email
                    };
                }
            }
        }

        const invoiceParams = {
            customerEmail: customerData.Email,
            customerName: `${customerData.Name} ${customerData.Surname}`,
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
