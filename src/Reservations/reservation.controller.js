'use strict';

import Reservation from './reservation.model.js';
import Table from '../Tables/table.model.js';

export const createReservation = async (req, res) => {
  try {
    const { tableId, customerName, date, time } = req.body;

    const table = await Table.findById(tableId);

    if (!table || !table.isActive) {
      return res.status(404).json({
        success: false,
        message: 'La mesa no existe o está inactiva'
      });
    }

    if (table.availability === 'ocupado') {
      return res.status(400).json({
        success: false,
        message: 'La mesa está ocupada actualmente'
      });
    }

    const existingReservation = await Reservation.findOne({
      table: tableId,
      date: new Date(date),
      time,
      status: 'activa'
    });

    if (existingReservation) {
      return res.status(400).json({
        success: false,
        message: 'La mesa ya está reservada en esa fecha y hora'
      });
    }

    const newReservation = await Reservation.create({
      table: tableId,
      customerName,
      date,
      time
    });

    table.availability = 'reservado';
    await table.save();

    return res.status(201).json({
      success: true,
      message: 'Reservación creada correctamente',
      reservation: newReservation
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una reservación para esa mesa en ese horario'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error al crear la reservación',
      error: error.message
    });
  }
};


export const cancelReservation = async (req, res) => {
  try {
    const { reservationId } = req.params;

    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservación no encontrada'
      });
    }

    reservation.status = 'cancelada';
    await reservation.save();

    await Table.findByIdAndUpdate(
      reservation.table,
      { availability: 'disponible' }
    );

    return res.status(200).json({
      success: true,
      message: 'Reservación cancelada correctamente'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al cancelar la reservación',
      error: error.message
    });
  }
};

export const getReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate({
        path: 'table',
        populate: {
          path: 'restaurant'
        }
      });

    return res.status(200).json({
      success: true,
      reservations
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error al obtener reservaciones',
      error: error.message
    });
  }
};
