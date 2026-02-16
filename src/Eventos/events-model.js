const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  title: {  // Agrego title para que sea más útil
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  additionalResources: {
    type: [String],  // ej: ["escenario", "sonido profesional", "mesas VIP"]
    default: []
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['programado', 'en curso', 'finalizado', 'cancelado'],
    default: 'programado'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Event', eventSchema);