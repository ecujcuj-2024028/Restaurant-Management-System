import Reservation from './reservation.model.js';

export const createReservation = async (req, res) => {
  try {
    const { tableNumber, customerName, date, time } = req.body;

    // 🔎 Validar que la mesa exista (datos quemados)
    const availableTables = [1, 2, 3, 4, 5];

    if (!availableTables.includes(tableNumber)) {
      return res.status(400).json({
        message: "La mesa no existe"
      });
    }

    // 🔎 Verificar disponibilidad
    const existingReservation = await Reservation.findOne({
      tableNumber,
      date,
      time
    });

    if (existingReservation) {
      return res.status(400).json({
        message: "La mesa ya está reservada en esa fecha y hora"
      });
    }

    // ✅ Crear reservación
    const newReservation = new Reservation({
      tableNumber,
      customerName,
      date,
      time
    });

    await newReservation.save();

    return res.status(201).json({
      message: "Reservación creada exitosamente",
      reservation: newReservation
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Ya existe una reservación para esa mesa en ese horario"
      });
    }

    return res.status(500).json({
      message: "Error al crear la reservación",
      error: error.message
    });
  }
};