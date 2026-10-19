const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  bookingReference: { type: String, sparse: true, index: true },
  tokenNumber: { type: String, default: () => `TKN-${Math.floor(1000 + Math.random() * 9000)}` },
  patientId: { type: String, index: true },
  doctorId: { type: String, index: true },
  patientName: { type: String, default: 'Patient' },
  mrn: { type: String, default: () => `MRN-${Math.floor(10000 + Math.random() * 90000)}` },
  doctorName: { type: String, default: 'Attending Physician' },
  department: { type: String, default: 'General Medicine' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] },
  timeSlot: { type: String, default: '10:00 AM' },
  slotStart: { type: Date, index: true },
  slotEnd: { type: Date, index: true },
  visitType: {
    type: String,
    enum: ['New Consultation', 'Follow-up', 'Emergency Triage', 'Telehealth', 'Pre-Op Check'],
    default: 'New Consultation'
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'Routine'
  },
  status: {
    type: String,
    default: 'CONFIRMED'
  },
  room: { type: String, default: 'Room 302' },
  waitMinutes: { type: Number, default: 0 },
  reason: { type: String, default: 'Evaluation & Clinical Review' }
}, { timestamps: true });

AppointmentSchema.index({ doctorId: 1, slotStart: 1 }, { background: true });

module.exports = mongoose.model('Appointment', AppointmentSchema);
