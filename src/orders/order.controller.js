import Order from './order.model.js';
import Product from '../gastronomy-oferts/product.model.js';
import Inventory from '../inventory/inventory.model.js';
import Reservation from '../Reservations/reservation.model.js';


export const createOrder = async (req, res) => {
  try {
    const { tableNumber, items, restaurantId } = req.body;
    const userId = req.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Debe enviar al menos un producto" });
    }
    
    let total = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product || !product.isActive || !product.isAvailable) {
        return res.status(400).json({
          message: `Producto inválido o no disponible`
        });
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
        const inventoryItem = await Inventory.findOne({
          restaurant: restaurantId,
          name: ingredient.name
        });

        if (!inventoryItem) {
          return res.status(400).json({
            message: `No existe inventario para ${ingredient.name}`
          });
        }

        if (inventoryItem.quantity < item.quantity) {
          return res.status(400).json({
            message: `Stock insuficiente para ${ingredient.name}`
          });
        }

        inventoryItem.quantity -= item.quantity;
        await inventoryItem.save();

        // 🔔 ALERTA LOW STOCK
        if (inventoryItem.quantity < 5) {
          console.log(`⚠️ Stock bajo de ${inventoryItem.name}`);
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

    return res.status(201).json({
      message: "Pedido creado correctamente",
      order: newOrder
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error al crear el pedido",
      error: error.message
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ message: "Pedido no encontrado" });
    }

    if (!['recibido', 'en_preparacion'].includes(order.status)) {
      return res.status(400).json({
        message: "No se puede cancelar este pedido"
      });
    }

    // 🔥 REVERTIR STOCK
    for (const item of order.items) {
      const product = await Product.findById(item.productId);

      for (const ingredient of product.ingredients) {
        const inventoryItem = await Inventory.findOne({
          restaurant: order.restaurantId,
          name: ingredient.name
        });

        if (inventoryItem) {
          inventoryItem.quantity += item.quantity;
          await inventoryItem.save();
        }
      }
    }

    order.status = 'cancelado';
    await order.save();

    return res.json({
      message: "Pedido cancelado correctamente",
      order
    });

  } catch (error) {
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

    const reservations = await Reservation.find({
      userId,
      status: { $ne: 'cancelada' }
    }).sort({ createdAt: -1 });

    return res.json({
      page,
      limit,
      orders,
      reservations
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error al obtener historial",
      error: error.message
    });
  }
};