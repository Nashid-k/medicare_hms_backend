const mongoose = require('mongoose');

const InventoryBatchSchema = new mongoose.Schema({
  batchId: { type: String, required: true, unique: true },
  medicineName: { type: String, required: true },
  formulation: { type: String, default: 'Film-Coated Tablet · Oral' },
  category: {
    type: String,
    enum: ['CARDIO', 'ANTI', 'ANALG', 'RESP', 'NEURO', 'ONCO', 'GENERAL'],
    default: 'CARDIO'
  },
  ndc: { type: String, required: true },
  manufacturer: { type: String, required: true },
  quantity: { type: Number, required: true },
  minLevel: { type: Number, default: 100 },
  unitPrice: { type: Number, required: true },
  expiryDate: { type: String, required: true },
  status: {
    type: String,
    enum: ['Optimal', 'Low Stock', 'Near Expiry', 'Quarantine'],
    default: 'Optimal'
  }
}, { timestamps: true });

module.exports = mongoose.model('InventoryBatch', InventoryBatchSchema);
