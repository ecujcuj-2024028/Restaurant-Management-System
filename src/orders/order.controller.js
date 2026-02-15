import Order from './order.model.js';

export const createOrder = async (req, res) => {
  try {
    const { tableNumber, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Debe enviar al menos un plato"
      });
    }

    // 🔥 MENÚ QUEMADO (Hardcoded)
    const menu = [
      { name: "Pizza", price: 80 },
      { name: "Hamburguesa", price: 45 },
      { name: "Pasta", price: 60 },
      { name: "Refresco", price: 15 }
    ];

    let total = 0;
    const processedItems = [];

    for (const item of items) {

      const menuItem = menu.find(d => d.name === item.dishName);

      if (!menuItem) {
        return res.status(400).json({
          message: `El plato ${item.dishName} no existe en el menú`
        });
      }

      const subtotal = menuItem.price * item.quantity;

      total += subtotal;

      processedItems.push({
        dishName: item.dishName,
        quantity: item.quantity,
        price: menuItem.price,
        subtotal
      });
    }

    const newOrder = new Order({
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