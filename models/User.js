const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'receptionist', 'pharmacist', 'admin'],
    required: true,
    index: true
  },
  phone: { type: String, default: '+1 (555) 000-0000' },
  accountStatus: {
    type: String,
    enum: ['active', 'pending_verification', 'suspended', 'deactivated'],
    default: 'active',
    index: true
  },
  avatar: { type: String, default: '' },
  resetPasswordToken: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
