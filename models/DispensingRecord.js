const mongoose = require('mongoose');

const DispensingRecordSchema = new mongoose.Schema({
  prescriptionId: { type: String, required: true, index: true },
  patientId: { type: String, index: true },
  patientName: { type: String, default: 'Patient' },
  dispensedBy: { type: String, required: true },
  items: [
    {
      batchId: { type: String, required: true },
      medicineName: { type: String, required: true },
      quantityDispensed: { type: Number, required: true },
      unitPrice: { type: Number, default: 0 },
      totalPrice: { type: Number, default: 0 }
    }
  ],
  dispensedAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('DispensingRecord', DispensingRecordSchema);
