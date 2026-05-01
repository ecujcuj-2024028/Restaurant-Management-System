import mongoose from 'mongoose';

const externalOrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    quantity: Number,
    price: Number,
    subtotal: Number
  },
  { _id: false }
);

const externalOrderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    // 'domicilio' = delivery, 'para_llevar'
    orderType: {
      type: String,
      enum: ['domicilio', 'para_llevar'],
      required: true
    },

    // Solo requerido para domicilio
    deliveryAddress: {
      street:     { type: String },
      reference:  { type: String },
      city:       { type: String },
      phone:      { type: String }
    },

    // Nota especial del cliente
    customerNote: {
      type: String,
      default: ''
    },

    items: [externalOrderItemSchema],

    total: {
      type: Number,
      required: true
    },

    // Costo de envío (0 para para_llevar)
    deliveryFee: {
      type: Number,
      default: 0
    },

    status: {
      type: String,
      enum: [
        'recibido',
        'confirmado',
        'en_preparacion',
        'listo',
        'en_camino',      // Solo domicilio
        'entregado',
        'cancelado'
      ],
      default: 'recibido'
    },

    // Tiempo estimado de entrega/recolección (minutos)
    estimatedTime: {
      type: Number,
      default: null
    },

    invoiceGenerated: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

export default mongoose.model('ExternalOrder', externalOrderSchema);
