'use strict';

import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema(
  {
    table: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'La mesa es requerida']
    },

    customerName: {
      type: String,
      required: [true, 'El nombre del cliente es requerido']
    },

    date: {
      type: Date,
      required: [true, 'La fecha es requerida']
    },

    time: {
      type: String,
      required: [true, 'La hora es requerida']
    },

    status: {
      type: String,
      enum: ['activa', 'cancelada', 'finalizada'],
      default: 'activa'
    }
  },
  { timestamps: true }
);

reservationSchema.index(
  { table: 1, date: 1, time: 1 },
  { unique: true }
);

export default mongoose.model('Reservation', reservationSchema);
