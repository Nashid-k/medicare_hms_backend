const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  mrn: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  dob: { type: String, default: '14 May 1976' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  bloodGroup: { type: String, default: 'O+ Positive' },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  allergies: [{ type: String }],
  chronicConditions: [{ type: String }],
  department: { type: String, default: 'Cardiology Wing' },
  attendingDoctor: { type: String, default: 'Dr. Sarah Jenkins' },
  wardBed: { type: String, default: 'Outpatient' },
  status: {
    type: String,
    enum: ['Active Consult', 'Inpatient', 'Triage Waiting', 'Discharged', 'Critical ICU'],
    default: 'Active Consult'
  },
  acuity: {
    type: String,
    enum: ['Emerald', 'Amber', 'Rose'],
    default: 'Amber'
  },
  insuranceProvider: { type: String, default: 'BlueCross Clinical Shield' },
  insurancePolicyNo: { type: String, default: 'BC-99281-X' },
  vitals: {
    bp: { type: String, default: '138/88' },
    hr: { type: Number, default: 84 },
    spo2: { type: Number, default: 98 },
    temp: { type: String, default: '37.1°C' },
    respRate: { type: Number, default: 16 },
    weight: { type: String, default: '78.4 kg' }
  },
  clinicalNotes: [
    {
      date: { type: String },
      doctor: { type: String },
      chiefComplaint: { type: String },
      soapNote: { type: String },
      icd10: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Patient', PatientSchema);
