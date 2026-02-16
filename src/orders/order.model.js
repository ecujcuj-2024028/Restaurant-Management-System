import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true
  },
  items: [
    {
      dishName: String,
      quantity: Number,
      price: Number,
      subtotal: Number
    }
  ],
  total: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Order', orderSchema);