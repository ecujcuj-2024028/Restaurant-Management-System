import ExternalOrder from './external-order.model.js';
import Product from '../product/products-model.js';
import { InventoryItem } from '../inventory/inventory.model.js';
import Restaurant from '../restaurants/restaurant.model.js';
import { sendInvoiceEmail } from '../../helpers/email-service.js';
import { ADMIN_RESTAURANTE, ADMIN_SISTEMA } from '../../helpers/role-constants.js';

// ─── TRANSICIONES DE ESTADO POR TIPO ───────────────────────────────────────────
const STATUS_TRANSITIONS = {
  domicilio: {
    recibido:        'confirmado',
    confirmado:      'en_preparacion',
    en_preparacion:  'listo',
    listo:           'en_camino',
    en_camino:       'entregado'
  },
  para_llevar: {
    recibido:       'confirmado',
    confirmado:     'en_preparacion',
    en_preparacion: 'listo',
    listo:          'entregado'
  }
};

// ─── CREAR PEDIDO EXTERNO ───────────────────────────────────────────────────────
export const createExternalOrder = async (req, res) => {
  try {
    const { restaurantId, orderType, deliveryAddress, customerNote, items, deliveryFee } = req.body;
    const userId = req.userId;

    // Validaciones básicas
    if (!orderType || !['domicilio', 'para_llevar'].includes(orderType)) {
      return res.status(400).json({ message: "orderType debe ser 'domicilio' o 'para_llevar'" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }

    // Dirección obligatoria para domicilio
    if (orderType === 'domicilio') {
      if (!deliveryAddress?.street || !deliveryAddress?.phone) {
        return res.status(400).json({ message: "Para pedidos a domicilio se requiere calle y teléfono de entrega" });
      }
    }

    let total = 0;
    const processedItems = [];

    // Procesar productos e inventario
    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive || !product.isAvailable) {
        return res.status(400).json({ message: `Producto inválido o no disponible` });
      }

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
          where: {
            RestaurantId: restaurantId,
            Name:         ingredient.name
          }
        });

        if (!inventoryItem) {
          return res.status(400).json({
            message: `No existe inventario para el insumo: ${ingredient.name}`
          });
        }

        const ingredientQty = parseFloat(ingredient.quantity) || 1;

        if (parseFloat(inventoryItem.Quantity) < ingredientQty * item.quantity) {
          return res.status(400).json({
            message: `Stock insuficiente para ${ingredient.name}. Disponible: ${inventoryItem.Quantity}`
          });
        }

        inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) - (ingredientQty * item.quantity);
        await inventoryItem.save();

        if (parseFloat(inventoryItem.Quantity) <= parseFloat(inventoryItem.MinStock)) {
          console.log(`ALERTA: Stock crítico de ${inventoryItem.Name}. Nivel actual: ${inventoryItem.Quantity}`);
        }
      }
    }

    const fee = orderType === 'para_llevar' ? 0 : (parseFloat(deliveryFee) || 0);
    const grandTotal = total + fee;

    const newOrder = new ExternalOrder({
      restaurantId,
      userId,
      orderType,
      deliveryAddress: orderType === 'domicilio' ? deliveryAddress : undefined,
      customerNote:    customerNote || '',
      items:           processedItems,
      total:           grandTotal,
      deliveryFee:     fee
    });

    await newOrder.save();

    return res.status(201).json({
      message: `Pedido ${orderType === 'domicilio' ? 'a domicilio' : 'para llevar'} creado correctamente`,
      order:   newOrder
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error al crear el pedido",
      error:   error.message
    });
  }
};

// ─── CANCELAR PEDIDO EXTERNO ────────────────────────────────────────────────────
export const cancelExternalOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId  = req.userId;

    const order = await ExternalOrder.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    // Solo el dueño puede cancelar
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "No tienes permiso para cancelar este pedido" });
    }

    if (!['recibido', 'confirmado'].includes(order.status)) {
      return res.status(400).json({ message: "El pedido ya no puede cancelarse (ya está en preparación o más avanzado)" });
    }

    // Restaurar inventario
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (!product) continue;

      for (const ingredient of product.ingredients) {
        const inventoryItem = await InventoryItem.findOne({
          where: {
            RestaurantId: order.restaurantId.toString(),
            Name:         ingredient.name
          }
        });

        if (inventoryItem) {
          const ingredientQty = parseFloat(ingredient.quantity) || 1;
          inventoryItem.Quantity = parseFloat(inventoryItem.Quantity) + (ingredientQty * item.quantity);
          await inventoryItem.save();
        }
      }
    }

    order.status = 'cancelado';
    await order.save();

    return res.json({ message: "Pedido cancelado correctamente", order });

  } catch (error) {
    return res.status(500).json({
      message: "Error al cancelar el pedido",
      error:   error.message
    });
  }
};

// ─── AVANZAR ESTADO (Admin) ─────────────────────────────────────────────────────
export const updateExternalOrderStatus = async (req, res) => {
  try {
    const { id }    = req.params;
    const { status, estimatedTime } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'El campo status es requerido' });
    }

    const order = await ExternalOrder.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    const transitions = STATUS_TRANSITIONS[order.orderType];
    const validNext   = transitions[order.status];

    if (!validNext) {
      return res.status(400).json({
        message: `El pedido está en estado '${order.status}' y no puede avanzar`
      });
    }

    if (status !== validNext) {
      return res.status(400).json({
        message: `Transición inválida. De '${order.status}' solo se puede pasar a '${validNext}'`
      });
    }

    order.status = status;

    // Guardar tiempo estimado si se envía al confirmar
    if (estimatedTime && order.status === 'confirmado') {
      order.estimatedTime = estimatedTime;
    }

    await order.save();

    return res.json({ message: 'Estado actualizado correctamente', order });

  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
};

// ─── HISTORIAL DEL CLIENTE ──────────────────────────────────────────────────────
export const getExternalOrderHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 10;
    const skip   = (page - 1) * limit;

    const filter = { userId };
    if (req.query.orderType) filter.orderType = req.query.orderType;

    const [orders, total] = await Promise.all([
      ExternalOrder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      ExternalOrder.countDocuments(filter)
    ]);

    return res.json({ page, limit, total, orders });

  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener historial",
      error:   error.message
    });
  }
};

// ─── LISTAR PEDIDOS DEL RESTAURANTE (Admin) ─────────────────────────────────────
export const getRestaurantExternalOrders = async (req, res) => {
  try {
    const { restaurantId, status, orderType } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ message: 'restaurantId es requerido' });
    }

    const filter = { restaurantId };
    if (status)    filter.status    = status;
    if (orderType) filter.orderType = orderType;

    const orders = await ExternalOrder.find(filter).sort({ createdAt: -1 });

    return res.json({ orders });

  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener pedidos', error: error.message });
  }
};

// ─── DETALLE DE UN PEDIDO ───────────────────────────────────────────────────────
export const getExternalOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const userRoles    = req.userRoles || [];
    const isAdmin      = userRoles.some(role => [ADMIN_RESTAURANTE, ADMIN_SISTEMA].includes(role));

    const order = await ExternalOrder.findById(id);
    if (!order) return res.status(404).json({ message: 'Pedido no encontrado' });

    const isOwner = order.userId?.toString() === userId?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ message: "No tienes permiso para ver este pedido" });
    }

    return res.json({ order });

  } catch (error) {
    return res.status(500).json({ message: 'Error al obtener pedido', error: error.message });
  }
};

// ─── FACTURACIÓN ────────────────────────────────────────────────────────────────
export const getExternalOrderInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const authenticatedUserId = req.userId;
    const userRoles           = req.userRoles || [];

    const isAdmin = userRoles.some(role => [ADMIN_RESTAURANTE, ADMIN_SISTEMA].includes(role));

    const order = await ExternalOrder.findById(id);
    if (!order) return res.status(404).json({ success: false, message: 'Pedido no encontrado' });

    const isOwner = order.userId?.toString() === authenticatedUserId?.toString();
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'No tienes permiso.' });
    }

    if (order.status !== 'entregado') {
      return res.status(400).json({ success: false, message: 'El pedido aún no ha sido entregado.' });
    }

    const restaurant = await Restaurant.findById(order.restaurantId);
    
    // Info del cliente desde el token si es el dueño
    const customer = isOwner ? req.user : { Name: 'Cliente', Surname: 'Externo', Email: null };

    const orderTypeLabel = order.orderType === 'domicilio' ? 'Domicilio' : 'Para Llevar';

    const invoiceParams = {
      customerEmail:  customer?.Email,
      customerName:   customer ? `${customer.Name} ${customer.Surname}` : 'Cliente',
      invoiceNumber:  order._id.toString().slice(-8).toUpperCase(),
      date:           new Date(order.updatedAt).toLocaleString('es-GT', { dateStyle: 'long' }),
      restaurantName: restaurant?.name || 'GastroManager',
      tableNumber:    `${orderTypeLabel}`,
      items:          order.items.map(i => ({
        name:     i.name,
        quantity: i.quantity,
        price:    Number(i.price),
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
        console.error('Error enviando correo de factura:', err)
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Factura generada y enviada',
      invoice: {
        ...invoiceParams,
        orderType:       order.orderType,
        deliveryAddress: order.deliveryAddress,
        deliveryFee:     `Q ${Number(order.deliveryFee).toFixed(2)}`,
        total:           `Q ${invoiceParams.total.toFixed(2)}`
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
