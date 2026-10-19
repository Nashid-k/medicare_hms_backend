const mongoose = require('mongoose');

const ConsultationSchema = new mongoose.Schema({
  appointmentId: { type: String, index: true },
  patientId: { type: String, required: true, index: true },
  patientName: { type: String, required: true },
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  chiefComplaint: { type: String, required: true },
  vitals: {
    bpSystolic: { type: Number, default: 120 },
    bpDiastolic: { type: Number, default: 80 },
    heartRate: { type: Number, default: 72 },
    temperature: { type: Number, default: 98.6 },
    spo2: { type: Number, default: 99 },
    respiratoryRate: { type: Number, default: 16 },
    weightKg: { type: Number, default: 70 },
    heightCm: { type: Number, default: 175 },
    bmi: { type: Number, default: 22.9 }
  },
  diagnosis: {
    primary: { type: String, required: true },
    secondary: { type: [String], default: [] },
    icdCode: { type: String, default: 'Z00.00' }
  },
  clinicalNotes: { type: String, default: '' },
  treatmentPlan: { type: String, default: '' },
  prescribedMedicines: { type: Array, default: [] },
  recommendedTests: { type: [String], default: [] },
  followUpDate: { type: String, default: '' },
  status: { type: String, enum: ['In-Progress', 'Completed'], default: 'Completed' }
}, { timestamps: true });

module.exports = mongoose.model('Consultation', ConsultationSchema);
