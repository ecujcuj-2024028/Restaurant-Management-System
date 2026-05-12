import Order from './order.model.js';
import Product from '../product/products-model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Reservation from '../reservations/reservation.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { sendInvoiceEmail } from '../../helpers/email-service.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';
import { sequelize } from '../../configs/db-postgres.js';
import { Op } from 'sequelize';

export const createOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { tableNumber, items, restaurantId } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      await t.rollback();
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }

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
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const reservations = await Reservation.findAll({
      where: {
        userId,
        status: { [Op.ne]: 'cancelada' }
      },
      order: [['created_at', 'DESC']]
    });

    return res.json({ page, limit, orders, reservations });
  } catch (error) {
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

    if (!restaurantId) {
      return res.status(400).json({ message: 'restaurantId es requerido' });
    }

    const filter = { restaurantId };
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

        // 1. Extraer datos del usuario (Estructura Sequelize o Mock desde JWT)
        const authenticatedUserId = req.userId;
        const userRoles = req.userRoles || [];

        const isAdmin = userRoles.some(role => [ADMIN_RESTAURANTE, ADMIN_SISTEMA].includes(role));

        // 2. Buscar el pedido
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

        // 3. Seguridad
        const isOwner = order.userId?.toString() === authenticatedUserId?.toString();
        if (!isAdmin && !isOwner) {
            return res.status(403).json({ success: false, message: 'No tienes permiso.' });
        }

        // 4. Estado
        if (order.status !== 'entregado') {
            return res.status(400).json({ success: false, message: 'Pedido no entregado.' });
        }

        // 5. Búsqueda del restaurante
        const restaurant = await Restaurant.findById(order.restaurantId);
        
        // En microservicios, la info del cliente debería venir del Identity Service.
        // Si el usuario es el dueño, usamos sus datos del token.
        const customer = isOwner ? req.user : { Name: 'Cliente', Surname: 'Registrado', Email: null };

        // 6. Preparar datos para la función de correo
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

        // 7. Actualizar estado en DB
        if (!order.invoiceGenerated) {
            order.invoiceGenerated = true;
            await order.save();
        }

        // 8. Enviar Correo
        if (invoiceParams.customerEmail) {
            sendInvoiceEmail(invoiceParams).catch(err => 
                console.error('Error enviando correo:', err)
            );
        }

        // 9. Respuesta al cliente 
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
