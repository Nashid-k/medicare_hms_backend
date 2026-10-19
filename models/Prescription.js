const mongoose = require('mongoose');

const PrescriptionSchema = new mongoose.Schema({
  rxId: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  mrn: { type: String, required: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: 'Cardiology Wing' },
  diagnosis: { type: String, required: true },
  icd10: { type: String, default: 'I20.0' },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine'
  },
  medications: [
    {
      name: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: { type: String, required: true },
      quantity: { type: Number, required: true, default: 30 },
      batchId: { type: String, default: 'BAT-77312' }
    }
  ],
  status: {
    type: String,
    enum: ['Pending', 'Dispensed', 'Cancelled'],
    default: 'Pending'
  },
  dispensedAt: { type: Date },
  dispensedBy: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Prescription', PrescriptionSchema);
