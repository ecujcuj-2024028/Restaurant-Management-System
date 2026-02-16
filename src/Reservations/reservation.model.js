import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  tableNumber: {
    type: Number,
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

reservationSchema.index(
  { tableNumber: 1, date: 1, time: 1 },
  { unique: true }
);

export default mongoose.model('Reservation', reservationSchema);