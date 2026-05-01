import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
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

const orderSchema = new mongoose.Schema(
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

    tableNumber: {
      type: Number,
      required: true
    },

    items: [orderItemSchema],

    total: {
      type: Number,
      required: true
    },

    status: {
      type: String,
      enum: ['recibido', 'en_preparacion', 'listo', 'entregado', 'cancelado'],
      default: 'recibido'
    },

    invoiceGenerated: {
      type: Boolean,
      default: false
<<<<<<< HEAD:src/orders/order.model.js
=======
    },
    
    isDeleted: {
      type: Boolean,
      default: false
>>>>>>> origin/develop:Backend/services/order-service/src/orders/order.model.js
    }
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);