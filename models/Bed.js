const mongoose = require('mongoose');

const BedSchema = new mongoose.Schema({
  bedNumber: { type: String, required: true, unique: true },
  wardName: { type: String, required: true },
  floor: { type: String, default: 'Floor 3 · North Wing' },
  bedType: {
    type: String,
    enum: ['ICU Telemetry', 'Cardiac Step-Down', 'General Inpatient', 'Isolation Negative-Pressure', 'Surgical Recovery', 'Emergency Triage'],
    default: 'General Inpatient'
  },
  status: {
    type: String,
    enum: ['Occupied', 'Available', 'Cleaning', 'Reserved', 'Maintenance'],
    default: 'Available'
  },
  patientName: { type: String, default: '' },
  mrn: { type: String, default: '' },
  attendingDoctor: { type: String, default: '' },
  acuity: {
    type: String,
    enum: ['Emerald', 'Amber', 'Rose', 'None'],
    default: 'None'
  },
  admittedAt: { type: String, default: '' },
  diagnosis: { type: String, default: '' },
  ventilatorActive: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Bed', BedSchema);
