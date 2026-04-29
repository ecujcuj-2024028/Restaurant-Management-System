import Reservation from '../reservations/reservation.model.js';
import Order from '../orders/order.model.js';

export class CustomerHistoryController {

  static async getHistory(req, res) {
    try {
      const userId = req.userId;
      const reservationPage = parseInt(req.query.reservationPage) || 1;
      const orderPage = parseInt(req.query.orderPage) || 1;
      const limit = parseInt(req.query.limit) || 5;

      const reservationOffset = (reservationPage - 1) * limit;
      const orderSkip = (orderPage - 1) * limit;

      /* =========================
         RESERVATIONS (Sequelize)
      ========================= */
      const { count: reservationTotal, rows: reservations } = await Reservation.findAndCountAll({
        where: { userId },
        limit,
        offset: reservationOffset,
        order: [['createdAt', 'DESC']],
        // Si quisieras incluir la mesa, Sequelize usa 'include'
        // include: ['table'] 
      });

      /* =========================
         ORDERS (Mongoose)
      ========================= */
      const orderTotal = await Order.countDocuments({ userId });
      const orders = await Order.find({ userId })
        .populate('restaurantId', 'name')
        .sort({ createdAt: -1 })
        .skip(orderSkip)
        .limit(limit);

      return res.status(200).json({
        userId,
        reservations: {
          page: reservationPage,
          totalPages: Math.ceil(reservationTotal / limit),
          total: reservationTotal,
          data: reservations
        },
        orders: {
          page: orderPage,
          totalPages: Math.ceil(orderTotal / limit),
          total: orderTotal,
          data: orders
        }
      });

    } catch (error) {
      return res.status(500).json({
        message: "Error al obtener historial del usuario",
        error: error.message
      });
    }
  }
}
