const mongoose = require('mongoose');

const DoctorAvailabilitySchema = new mongoose.Schema({
  doctorId: { type: String, required: true, index: true },
  doctorName: { type: String, required: true },
  department: { type: String, default: 'General Medicine' },
  workingDays: { type: [Number], default: [1, 2, 3, 4, 5] }, // 0=Sun, 1=Mon...
  startTime: { type: String, default: '09:00' },
  endTime: { type: String, default: '17:00' },
  slotDuration: { type: Number, default: 30 }, // in minutes
  breakPeriods: [
    {
      title: { type: String, default: 'Lunch Break' },
      start: { type: String, default: '13:00' },
      end: { type: String, default: '14:00' }
    }
  ],
  vacationDates: { type: [String], default: [] },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('DoctorAvailability', DoctorAvailabilitySchema);
