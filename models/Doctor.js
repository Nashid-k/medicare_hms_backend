const mongoose = require('mongoose');

const DoctorSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  department: { type: String, required: true },
  qualification: { type: String, default: 'MD, FACC' },
  roleTitle: { type: String, default: 'Lead Attending' },
  room: { type: String, default: 'Suite 304-A' },
  shiftHours: { type: String, default: '08:00 - 18:00' },
  status: {
    type: String,
    enum: ['On Duty', 'In Surgery', 'In Consultation', 'Off Duty', 'On Call'],
    default: 'On Duty'
  },
  consultationFee: { type: Number, default: 180 },
  patientsToday: { type: Number, default: 14 },
  maxCapacity: { type: Number, default: 20 },
  verified: { type: Boolean, default: true },
  licenseNo: { type: String, default: 'NPI-8841209' },
  availableSlots: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Doctor', DoctorSchema);
