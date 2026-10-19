const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  billId: { type: String, required: true, index: true },
  patientId: { type: String, index: true },
  patientName: { type: String, default: 'Patient' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'INSURANCE', 'UPI'],
    default: 'RAZORPAY'
  },
  transactionReference: { type: String, index: true },
  razorpayOrderId: { type: String, index: true },
  razorpayPaymentId: { type: String, index: true },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED'],
    default: 'SUCCESS',
    index: true
  },
  paidAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
