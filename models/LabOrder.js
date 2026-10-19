const mongoose = require('mongoose');

const LabOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  patientName: { type: String, required: true },
  mrn: { type: String, required: true },
  testName: { type: String, required: true },
  category: {
    type: String,
    enum: ['Hematology', 'Cardiac Biomarkers', 'Biochemistry', 'Microbiology', 'Radiology PACS', 'Pathology Biopsy'],
    default: 'Cardiac Biomarkers'
  },
  priority: {
    type: String,
    enum: ['Routine', 'Urgent', 'STAT'],
    default: 'STAT'
  },
  orderedBy: { type: String, default: 'Dr. Sarah Jenkins' },
  status: {
    type: String,
    enum: ['Specimen Collected', 'In Analyzer', 'Completed', 'Critical Alert'],
    default: 'In Analyzer'
  },
  resultValue: { type: String, default: 'Pending Analyzer' },
  referenceRange: { type: String, default: '< 0.04 ng/mL' },
  flag: {
    type: String,
    enum: ['Normal', 'High', 'Critical', 'Pending'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('LabOrder', LabOrderSchema);
