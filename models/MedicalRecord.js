const mongoose = require('mongoose');

const MedicalRecordSchema = new mongoose.Schema({
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, index: true },
  doctorName: { type: String, default: '' },
  recordType: {
    type: String,
    enum: ['CONSULTATION', 'PRESCRIPTION', 'LAB_REPORT', 'RADIOLOGY', 'DISCHARGE_SUMMARY', 'VITAL_SIGN_LOG'],
    required: true,
    index: true
  },
  title: { type: String, required: true },
  summary: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  documentUrl: { type: String, default: '' },
  attachments: { type: Array, default: [] },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('MedicalRecord', MedicalRecordSchema);
