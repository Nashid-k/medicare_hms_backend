const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' },
  headDoctorName: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true },
  staffCount: { type: Number, default: 12 },
  roomCount: { type: Number, default: 8 }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
