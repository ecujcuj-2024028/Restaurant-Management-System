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

    orderType: {
      type: String,
      enum: ['domicilio', 'para_llevar'],
      required: true
    },

    deliveryAddress: {
      street:     { type: String },
      reference:  { type: String },
      city:       { type: String },
      phone:      { type: String }
    },

    customerNote: {
      type: String,
      default: ''
    },

    items: [externalOrderItemSchema],

    total: {
      type: Number,
      required: true
    },

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
        'en_camino',
        'entregado',
        'cancelado'
      ],
      default: 'recibido'
    },

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
