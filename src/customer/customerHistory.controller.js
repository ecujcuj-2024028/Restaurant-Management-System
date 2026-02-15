import Reservation from '../Reservations/reservation.model.js';
import Order from '../orders/order.model.js';

export class CustomerHistoryController {

  static async getHistory(req, res) {
    try {
      const { customerName } = req.params;

      if (!customerName) {
        return res.status(400).json({
          message: "Debe proporcionar el nombre del cliente"
        });
      }

      const reservations = await Reservation.find({ customerName });
      const orders = await Order.find({ customerName });

      return res.status(200).json({
        customer: customerName,
        reservations,
        orders
      });

    } catch (error) {
      return res.status(500).json({
        message: "Error al obtener historial del cliente",
        error: error.message
      });
    }
  }
}