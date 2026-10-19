const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  mrn: { type: String, required: true },
  department: { type: String, required: true },
  attendingDoctor: { type: String, default: 'Dr. Sarah Jenkins' },
  items: [
    {
      description: { type: String, required: true },
      category: { type: String, default: 'Clinical Service' },
      code: { type: String, default: 'CPT-99214' },
      amount: { type: Number, required: true }
    }
  ],
  subtotal: { type: Number, required: true },
  taxAmount: { type: Number, default: 0 },
  insuranceCovered: { type: Number, default: 0 },
  patientPayable: { type: Number, required: true },
  paymentMethod: { type: String, default: 'BlueCross Shield EDI' },
  status: {
    type: String,
    enum: ['Paid', 'Pending', 'Insurance Claim', 'Overdue'],
    default: 'Pending'
  },
  issuedDate: { type: String, default: '2026-10-09' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', InvoiceSchema);
