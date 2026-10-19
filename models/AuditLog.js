const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema({
  timeStr: { type: String, required: true },
  actor: { type: String, required: true },
  role: { type: String, default: 'Lead Attending' },
  module: { type: String, required: true },
  actionType: {
    type: String,
    enum: ['DISPENSED', 'INTAKE', 'CONSULT', 'BOOKING', 'ADMISSION', 'BILLING', 'LAB_STAT', 'SECURITY'],
    default: 'CONSULT'
  },
  summary: { type: String, required: true },
  severity: {
    type: String,
    enum: ['Emerald', 'Amber', 'Rose', 'Primary'],
    default: 'Emerald'
  }
}, { timestamps: true });

module.exports = mongoose.model('AuditLog', AuditLogSchema);
