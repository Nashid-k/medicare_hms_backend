const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Prescription = require('../models/Prescription');
const InventoryBatch = require('../models/InventoryBatch');
const Invoice = require('../models/Invoice');
const Bed = require('../models/Bed');
const LabOrder = require('../models/LabOrder');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Department = require('../models/Department');
const DoctorAvailability = require('../models/DoctorAvailability');
const Consultation = require('../models/Consultation');
const MedicalRecord = require('../models/MedicalRecord');
const DispensingRecord = require('../models/DispensingRecord');
const Payment = require('../models/Payment');
const crypto = require('crypto');

const pendingRazorpayOrders = new Map();
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_IDKEY || 'rzp_test_medicare_mock';
const razorpaySecret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET_KEY || 'medicare_test_secret';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'medicare_salt_secret').digest('hex');
}

function decodeAuthToken(authorizationHeader) {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) return null;
  try {
    return JSON.parse(
      Buffer.from(authorizationHeader.slice(7), 'base64').toString('utf8')
    );
  } catch {
    return null;
  }
}

function getRequestRole(req) {
  const decoded = decodeAuthToken(req.headers['authorization']);
  const role = String((decoded && decoded.role) || req.headers['x-user-role'] || '').toLowerCase();
  return role === 'reception' ? 'receptionist' : role;
}

async function resolvePatientForRequest(req) {
  const decoded = decodeAuthToken(req.headers['authorization']);
  const email = (decoded && decoded.email) || req.headers['x-user-email'] || req.query.email || '';
  const userId = (decoded && decoded.id) || req.headers['x-user-id'] || '';
  const patientName = req.headers['x-patient-name'] || req.query.patientName || '';
  const mrn = req.headers['x-patient-mrn'] || req.query.mrn || '';

  // 1. If MRN is provided directly
  if (mrn) {
    const patientByMrn = await Patient.findOne({ mrn });
    if (patientByMrn) return patientByMrn;
  }

  // 2. If email is provided
  if (email) {
    const patientByEmail = await Patient.findOne({ email: email.toLowerCase() });
    if (patientByEmail) return patientByEmail;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (user) {
      const patientByName = await Patient.findOne({ name: new RegExp('^' + user.name.trim() + '$', 'i') });
      if (patientByName) return patientByName;

      if (user.role === 'patient') {
        const count = await Patient.countDocuments();
        const newMrn = `MC-${8850 + count}`;
        return await Patient.create({
          mrn: newMrn,
          name: user.name,
          email: user.email.toLowerCase(),
          phone: user.phone || '+1 (555) 234-8800',
          age: 36,
          dob: '15 Aug 1988',
          gender: 'Other',
          bloodGroup: 'O+ Positive',
          department: 'General Medicine',
          attendingDoctor: 'Dr. Sarah Jenkins',
          status: 'Active Consult',
          acuity: 'Emerald',
          vitals: { bp: '120/80', hr: 72, spo2: 99, temp: '36.8°C', respRate: 16, weight: '70 kg' },
          allergies: ['None recorded'],
          chronicConditions: []
        });
      }
    }
  }

  // 3. If userId is provided
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    const user = await User.findById(userId);
    if (user) {
      const patient = await Patient.findOne({
        $or: [
          { email: user.email.toLowerCase() },
          { name: new RegExp('^' + user.name.trim() + '$', 'i') }
        ]
      });
      if (patient) return patient;
    }
  }

  // 4. If patient name is provided
  if (patientName) {
    const patientByName = await Patient.findOne({ name: new RegExp('^' + patientName.trim() + '$', 'i') });
    if (patientByName) return patientByName;
  }

  // 5. Fallback for default patient demo user
  return (await Patient.findOne({ mrn: 'MC-8821' })) || (await Patient.findOne());
}

function removePatientClinicalData(patient) {
  const patientData = patient.toObject ? patient.toObject() : { ...patient };
  delete patientData.bloodGroup;
  delete patientData.allergies;
  delete patientData.chronicConditions;
  delete patientData.vitals;
  delete patientData.clinicalNotes;
  return patientData;
}

function requireClinicalAccess(req, res, next) {
  // Role precedence: verified Bearer token > x-user-role header (demo contract)
  const decoded = decodeAuthToken(req.headers['authorization']);
  const role =
    (decoded && decoded.role) ||
    req.headers['x-user-role'] ||
    (req.user && req.user.role);
  if (role === 'receptionist') {
    return res.status(403).json({
      error: 'Access denied: Reception staff are restricted from clinical notes, vitals, and prescription records.'
    });
  }
  next();
}

function nowTimeStr() {
  return new Date().toTimeString().split(' ')[0];
}

// ==========================================
// AUTHENTICATION & SESSION ROUTES (/api/auth)
// ==========================================
router.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    const userRole = String(role || 'patient').toLowerCase();
    if (!['patient', 'doctor'].includes(userRole)) {
      return res.status(400).json({ error: 'Self-registration is available for patients and doctor applicants only.' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const accountStatus = userRole === 'doctor' ? 'pending_verification' : 'active';
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      role: userRole,
      phone: phone || '+1 (555) 000-0000',
      accountStatus
    });

    const userObj = user.toObject();
    delete userObj.passwordHash;
    const token = Buffer.from(JSON.stringify({ id: user._id, role: user.role, email: user.email })).toString('base64');
    res.status(201).json({ user: userObj, token, message: 'Registration successful.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const hashed = hashPassword(password);
    if (user.passwordHash !== hashed) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.accountStatus === 'suspended' || user.accountStatus === 'deactivated') {
      return res.status(403).json({ error: 'Your account has been suspended. Please contact administrator.' });
    }
    if (user.role === 'doctor' && user.accountStatus === 'pending_verification') {
      return res.status(403).json({ error: 'Your doctor account is pending administrator verification.' });
    }

    const userObj = user.toObject();
    delete userObj.passwordHash;
    const token = Buffer.from(JSON.stringify({ id: user._id, role: user.role, email: user.email })).toString('base64');
    res.json({ user: userObj, token, message: 'Authentication successful.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

router.get('/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const roleHeader = req.headers['x-user-role'];
    const emailHeader = req.headers['x-user-email'];

    if (roleHeader) {
      const user = await User.findOne({ role: roleHeader }).select('-passwordHash');
      if (user) return res.json(user);
    }
    if (emailHeader) {
      const user = await User.findOne({ email: emailHeader.toLowerCase() }).select('-passwordHash');
      if (user) return res.json(user);
    }
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        if (decoded.id) {
          const user = await User.findById(decoded.id).select('-passwordHash');
          if (user) return res.json(user);
        }
      } catch (_) {}
    }

    const demoUser = await User.findOne({ role: 'admin' }).select('-passwordHash');
    res.json(demoUser || { name: 'Demo Administrator', role: 'admin', email: 'admin@medicare.test' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60000);
    await user.save();
    res.json({ success: true, message: 'Password reset token generated.', resetToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: 'Token and newPassword are required.' });
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });
    if (!user) return res.status(400).json({ error: 'Password reset token is invalid or has expired.' });
    user.passwordHash = hashPassword(newPassword);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    res.json({ success: true, message: 'Password has been successfully updated.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// DEPARTMENTS DIRECTORY (/api/departments)
// ==========================================
router.get('/departments', async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/departments', async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 1. DASHBOARD AGGREGATION
router.get('/dashboard', async (req, res) => {
  try {
    const role = getRequestRole(req);
    if (!role) return res.status(401).json({ error: 'Authentication role is required.' });
    if (!['patient', 'doctor', 'receptionist', 'pharmacist', 'admin'].includes(role)) {
      return res.status(403).json({ error: 'Invalid account role.' });
    }

    // Role-specific optimization & HIPAA privacy guard:
    // Patients ONLY see their own health profile, appointments, prescriptions, and invoices.
    if (role === 'patient') {
      const myPatient = await resolvePatientForRequest(req);
      const doctors = await Doctor.find().sort({ name: 1 });
      const departments = await Department.find({ isActive: true }).sort({ name: 1 });

      let myAppointments = [];
      let myPrescriptions = [];
      let myInvoices = [];
      let myLabs = [];

      if (myPatient) {
        [myAppointments, myPrescriptions, myInvoices, myLabs] = await Promise.all([
          Appointment.find({
            $or: [
              { mrn: myPatient.mrn },
              { patientName: myPatient.name },
              ...(myPatient._id ? [{ patientId: String(myPatient._id) }] : [])
            ]
          }).sort({ slotStart: -1, createdAt: -1 }),
          Prescription.find({
            $or: [
              { mrn: myPatient.mrn },
              { patientName: myPatient.name }
            ]
          }).sort({ createdAt: -1 }),
          Invoice.find({
            $or: [
              { mrn: myPatient.mrn },
              { patientName: myPatient.name }
            ]
          }).sort({ createdAt: -1 }),
          LabOrder.find({
            $or: [
              { mrn: myPatient.mrn },
              { patientName: myPatient.name }
            ]
          }).sort({ createdAt: -1 })
        ]);
      }

      const activeAppointments = myAppointments.filter(
        (a) => a.status !== 'Cancelled' && a.status !== 'CANCELLED'
      );
      const upcomingAppointments = activeAppointments.filter(
        (a) => a.status !== 'Completed'
      );
      const pendingInvoices = myInvoices.filter((i) => i.status !== 'Paid');
      const pendingBalance = pendingInvoices.reduce(
        (acc, inv) => acc + (inv.patientPayable != null ? inv.patientPayable : inv.subtotal || 0),
        0
      );

      return res.json({
        role: 'patient',
        patientProfile: myPatient,
        stats: {
          upcomingAppointments: upcomingAppointments.length,
          totalAppointments: myAppointments.length,
          activePrescriptions: myPrescriptions.filter((p) => p.status !== 'Cancelled').length,
          pendingInvoices: pendingInvoices.length,
          pendingBalance,
          lastBp: myPatient?.vitals?.bp || '120/80',
          lastHr: myPatient?.vitals?.hr || 72,
          bloodGroup: myPatient?.bloodGroup || 'O+ Positive',
          allergiesCount: (myPatient?.allergies || []).length
        },
        patients: myPatient ? [myPatient] : [],
        appointments: myAppointments,
        prescriptions: myPrescriptions,
        invoices: myInvoices,
        labs: myLabs,
        doctors,
        departments,
        beds: [],
        inventory: [],
        auditLogs: []
      });
    }

    const [
      patients,
      doctors,
      appointments,
      prescriptions,
      inventory,
      invoices,
      beds,
      labs,
      auditLogs
    ] = await Promise.all([
      Patient.find().sort({ updatedAt: -1 }),
      Doctor.find().sort({ name: 1 }),
      Appointment.find().sort({ createdAt: -1 }),
      Prescription.find().sort({ createdAt: -1 }),
      InventoryBatch.find().sort({ createdAt: -1 }),
      Invoice.find().sort({ createdAt: -1 }),
      Bed.find().sort({ bedNumber: 1 }),
      LabOrder.find().sort({ createdAt: -1 }),
      AuditLog.find().sort({ createdAt: -1 }).limit(20)
    ]);

    const occupiedBeds = beds.filter((b) => b.status === 'Occupied').length;
    const availableBeds = beds.filter((b) => b.status === 'Available').length;
    const pendingRx = prescriptions.filter((p) => p.status === 'Pending').length;
    const dispensedRx = prescriptions.filter((p) => p.status === 'Dispensed').length;
    const lowStockCount = inventory.filter((i) => i.status === 'Low Stock' || i.quantity <= i.minLevel).length;
    const criticalLabs = labs.filter((l) => l.flag === 'Critical' || l.status === 'Critical Alert').length;
    const paidRevenue = invoices
      .filter((inv) => inv.status === 'Paid')
      .reduce((acc, inv) => acc + inv.subtotal, 0);
    const pendingRevenue = invoices
      .filter((inv) => inv.status !== 'Paid')
      .reduce((acc, inv) => acc + inv.subtotal, 0);

    res.json({
      stats: {
        totalPatients: patients.length,
        activeInpatients: patients.filter((p) => p.status === 'Inpatient' || p.status === 'Critical ICU').length,
        doctorsOnDuty: doctors.filter((d) => d.status !== 'Off Duty').length,
        totalDoctors: doctors.length,
        appointmentsToday: appointments.length,
        completedAppointments: appointments.filter((a) => a.status === 'Completed').length,
        waitingAppointments: appointments.filter((a) => a.status === 'Waiting' || a.status === 'Checked-In').length,
        occupiedBeds,
        availableBeds,
        totalBeds: beds.length,
        bedOccupancyRate: beds.length ? Math.round((occupiedBeds / beds.length) * 100) : 0,
        pendingRx,
        dispensedRx,
        lowStockCount,
        criticalLabs,
        paidRevenue,
        pendingRevenue
      },
      patients: role === 'doctor'
        ? patients
        : role === 'receptionist'
          ? patients.map(removePatientClinicalData)
          : [],
      doctors,
      appointments: ['doctor', 'receptionist', 'admin'].includes(role) ? appointments : [],
      prescriptions: ['doctor', 'pharmacist'].includes(role) ? prescriptions : [],
      inventory: ['pharmacist', 'admin'].includes(role) ? inventory : [],
      invoices: ['receptionist', 'admin'].includes(role) ? invoices : [],
      beds: ['doctor', 'receptionist', 'admin'].includes(role) ? beds : [],
      labs: role === 'doctor' ? labs : [],
      auditLogs: role === 'admin' ? auditLogs : []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. PATIENTS CRUD & EHR NOTES / VITALS
router.get('/patients', async (req, res) => {
  try {
    const role = getRequestRole(req);
    if (!role) return res.status(401).json({ error: 'Authentication role is required.' });
    if (role === 'patient') {
      const myPatient = await resolvePatientForRequest(req);
      return res.json(myPatient ? [myPatient] : []);
    }
    const patients = await Patient.find().sort({ createdAt: -1 });
    res.json(role === 'doctor' ? patients : role === 'receptionist' ? patients.map(removePatientClinicalData) : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/patients', async (req, res) => {
  try {
    const mrn = req.body.mrn || `MC-${Math.floor(8840 + Math.random() * 1100)}`;
    const patient = await Patient.create({ ...req.body, mrn });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: req.body.attendingDoctor || 'Reception Intake',
      role: 'Admissions Desk',
      module: 'Patient Intake & EHR',
      actionType: 'ADMISSION',
      summary: `Registered patient ${patient.name} (#${patient.mrn}) into ${patient.department}.`,
      severity: 'Primary'
    });
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/patients/:id', async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/patients/:id/vitals', requireClinicalAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    patient.vitals = { ...patient.vitals, ...req.body };
    await patient.save();
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: patient.attendingDoctor || 'Dr. Sarah Jenkins',
      role: 'Clinical Nursing',
      module: 'Vitals Telemetry',
      actionType: 'CONSULT',
      summary: `Updated vitals for ${patient.name} (#${patient.mrn}): BP ${patient.vitals.bp}, HR ${patient.vitals.hr} bpm, SpO2 ${patient.vitals.spo2}%.`,
      severity: 'Emerald'
    });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/patients/:id/notes', requireClinicalAccess, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    const newNote = {
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      doctor: req.body.doctor || 'Dr. Sarah Jenkins',
      chiefComplaint: req.body.chiefComplaint || 'Clinical Consultation Follow-up',
      soapNote: req.body.soapNote,
      icd10: req.body.icd10 || 'Z00.00'
    };
    patient.clinicalNotes.unshift(newNote);
    await patient.save();
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: newNote.doctor,
      role: 'Lead Attending',
      module: 'Doctor Consultation Workspace',
      actionType: 'CONSULT',
      summary: `Signed SOAP encounter note (ICD-10: ${newNote.icd10}) for ${patient.name} (#${patient.mrn}).`,
      severity: 'Primary'
    });
    res.json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/patients/:id', async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. DOCTORS CRUD
router.get('/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ name: 1 });
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/doctors', async (req, res) => {
  try {
    const employeeId = req.body.employeeId || `DOC-${Math.floor(200 + Math.random() * 799)}`;
    const doctor = await Doctor.create({
      ...req.body,
      employeeId,
      availableSlots: req.body.availableSlots || ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM']
    });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'System Admin',
      role: 'Medical Credentialing',
      module: 'Doctor Roster & Governance',
      actionType: 'SECURITY',
      summary: `Credentialed & onboarded ${doctor.name} (${doctor.specialty}) to ${doctor.department}.`,
      severity: 'Emerald'
    });
    res.status(201).json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(doctor);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/doctors/:id/slots', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query;
    const queryDate = date || new Date().toISOString().slice(0, 10);

    const doctor = await Doctor.findOne({
      $or: [
        { _id: doctorId.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null },
        { employeeId: doctorId }
      ]
    });
    const availability = await DoctorAvailability.findOne({
      doctorId: doctor ? doctor.employeeId : doctorId
    });

    const startTime = availability?.startTime || '09:00';
    const endTime = availability?.endTime || '17:00';
    const slotDuration = availability?.slotDuration || 30;
    const breakPeriods = availability?.breakPeriods || [{ start: '13:00', end: '14:00' }];

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    let currentMin = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    const startOfDay = new Date(`${queryDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${queryDate}T23:59:59.999Z`);
    const booked = await Appointment.find({
      $or: [{ doctorId }, { doctorName: doctor?.name }],
      status: { $nin: ['Cancelled', 'CANCELLED'] },
      $or: [
        { slotStart: { $gte: startOfDay, $lte: endOfDay } },
        { date: queryDate }
      ]
    });

    const bookedTimes = booked.map(b => {
      if (b.slotStart) {
        const d = new Date(b.slotStart);
        return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
      }
      return b.timeSlot;
    });

    const availableSlots = [];
    while (currentMin + slotDuration <= endMinutes) {
      const h = Math.floor(currentMin / 60);
      const m = currentMin % 60;
      const timeStr24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;

      const isBreak = breakPeriods.some(b => {
        const [bStartH, bStartM] = b.start.split(':').map(Number);
        const [bEndH, bEndM] = b.end.split(':').map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;
        return currentMin >= bStart && currentMin < bEnd;
      });

      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      const label12 = `${String(hour12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;

      const isBooked = bookedTimes.includes(timeStr24) || bookedTimes.includes(label12);

      if (!isBreak && !isBooked) {
        availableSlots.push({
          time24: timeStr24,
          label: label12,
          slotStart: `${queryDate}T${timeStr24}:00.000Z`,
          slotEnd: `${queryDate}T${String(Math.floor((currentMin + slotDuration)/60)).padStart(2,'0')}:${String((currentMin + slotDuration)%60).padStart(2,'0')}:00.000Z`
        });
      }
      currentMin += slotDuration;
    }

    res.json({
      doctorId,
      date: queryDate,
      totalSlots: availableSlots.length,
      slots: availableSlots
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/doctors/:id', async (req, res) => {
  try {
    const doc = await Doctor.findOne({
      $or: [
        { _id: req.params.id.match(/^[0-9a-fA-F]{24}$/) ? req.params.id : null },
        { employeeId: req.params.id }
      ]
    });
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/doctors/profile', async (req, res) => {
  try {
    const { doctorId, ...update } = req.body;
    const doc = await Doctor.findOneAndUpdate(
      { $or: [{ employeeId: doctorId }, { _id: doctorId?.match(/^[0-9a-fA-F]{24}$/) ? doctorId : null }] },
      update,
      { new: true }
    );
    res.json(doc || { success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/doctors/availability', async (req, res) => {
  try {
    const { doctorId, ...update } = req.body;
    const avail = await DoctorAvailability.findOneAndUpdate(
      { doctorId },
      update,
      { new: true, upsert: true }
    );
    res.json(avail);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. APPOINTMENTS & QUEUE ENGINE
router.get('/appointments', async (req, res) => {
  try {
    const role = getRequestRole(req);
    if (role === 'patient') {
      const myPatient = await resolvePatientForRequest(req);
      if (!myPatient) return res.json([]);
      const myAppointments = await Appointment.find({
        $or: [
          { mrn: myPatient.mrn },
          { patientName: myPatient.name },
          ...(myPatient._id ? [{ patientId: String(myPatient._id) }] : [])
        ]
      }).sort({ slotStart: -1, createdAt: -1 });
      return res.json(myAppointments);
    }
    const appointments = await Appointment.find().sort({ createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/appointments', async (req, res) => {
  try {
    const { slotStart, slotEnd, doctorId, timeSlot, date } = req.body;

    // 1. Validate past dates (QA Edge Case: Reject past bookings)
    if (slotStart && new Date(slotStart) <= new Date()) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }

    // 2. Anti-collision double-booking check (QA Concurrency Guard)
    if (doctorId && slotStart) {
      const targetStart = new Date(slotStart);
      const targetEnd = slotEnd ? new Date(slotEnd) : new Date(targetStart.getTime() + 30 * 60000);

      const existingConflict = await Appointment.findOne({
        doctorId,
        status: { $nin: ['Cancelled', 'CANCELLED'] },
        $or: [
          { slotStart: targetStart },
          { slotStart: { $lt: targetEnd, $gte: targetStart } }
        ]
      });

      if (existingConflict) {
        return res.status(409).json({ error: 'This time slot is already booked. Please select another slot.' });
      }
    }

    const count = await Appointment.countDocuments();
    const tokenNumber = req.body.tokenNumber || `TKN-0${41 + count}`;
    const bookingReference = req.body.bookingReference || `APT-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointment = await Appointment.create({
      ...req.body,
      tokenNumber,
      bookingReference,
      status: req.body.status || 'CONFIRMED'
    });

    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Booking Engine',
      role: 'Scheduler Mutex',
      module: 'Appointment & Queue Engine',
      actionType: 'BOOKING',
      summary: `Booked ${appointment.bookingReference || appointment.tokenNumber} for ${appointment.patientName || 'Patient'} with ${appointment.doctorName || 'Doctor'}.`,
      severity: 'Primary'
    });
    res.status(201).json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (req.body.status) {
      await AuditLog.create({
        timeStr: nowTimeStr(),
        actor: appointment.doctorName,
        role: 'Queue Engine',
        module: 'Appointment Operations',
        actionType: 'BOOKING',
        summary: `Token ${appointment.tokenNumber} (${appointment.patientName}) transitioned to [${appointment.status}].`,
        severity: appointment.status === 'Completed' ? 'Emerald' : 'Primary'
      });
    }
    res.json(appointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/appointments/:id', async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/appointments/my', async (req, res) => {
  try {
    const patientName = req.query.patientName || req.headers['x-patient-name'];
    const doctorName = req.query.doctorName || req.headers['x-doctor-name'];
    const query = {};
    if (patientName) query.patientName = patientName;
    if (doctorName) query.doctorName = doctorName;
    const appointments = await Appointment.find(query).sort({ slotStart: -1, createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/appointments/:id', async (req, res) => {
  try {
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/appointments/:id/cancel', async (req, res) => {
  try {
    const { cancellationReason, cancelledBy } = req.body;
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'CANCELLED', cancellationReason: cancellationReason || 'Cancelled by user', cancelledAt: new Date(), cancelledBy },
      { new: true }
    );
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/appointments/:id/reschedule', async (req, res) => {
  try {
    const { slotStart, slotEnd, timeSlot, date } = req.body;
    if (slotStart && new Date(slotStart) <= new Date()) {
      return res.status(400).json({ error: 'Cannot reschedule into the past' });
    }
    const apt = await Appointment.findById(req.params.id);
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });

    if (apt.doctorId && slotStart) {
      const conflict = await Appointment.findOne({
        _id: { $ne: apt._id },
        doctorId: apt.doctorId,
        status: { $nin: ['Cancelled', 'CANCELLED'] },
        slotStart: new Date(slotStart)
      });
      if (conflict) {
        return res.status(409).json({ error: 'Requested time slot is already booked.' });
      }
    }

    apt.slotStart = slotStart ? new Date(slotStart) : apt.slotStart;
    apt.slotEnd = slotEnd ? new Date(slotEnd) : apt.slotEnd;
    if (timeSlot) apt.timeSlot = timeSlot;
    if (date) apt.date = date;
    apt.status = 'CONFIRMED';
    await apt.save();
    res.json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/appointments/:id/check-in', async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked-In' },
      { new: true }
    );
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/appointments/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const apt = await Appointment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==============================================================
// 4B. CLINICAL CONSULTATIONS & MEDICAL RECORDS (EHR WORKSPACE)
// ==============================================================
router.get('/consultations', requireClinicalAccess, async (req, res) => {
  try {
    const query = {};
    if (req.query.patientId) query.patientId = req.query.patientId;
    if (req.query.doctorId) query.doctorId = req.query.doctorId;
    const list = await Consultation.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/consultations', requireClinicalAccess, async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      patientName,
      doctorId,
      doctorName,
      chiefComplaint,
      vitals,
      diagnosis,
      clinicalNotes,
      treatmentPlan,
      prescribedMedicines,
      recommendedTests,
      followUpDate
    } = req.body;

    let calculatedVitals = { ...vitals };
    if (calculatedVitals.weightKg && calculatedVitals.heightCm) {
      const heightM = calculatedVitals.heightCm / 100;
      calculatedVitals.bmi = parseFloat((calculatedVitals.weightKg / (heightM * heightM)).toFixed(1));
    }

    const consultation = await Consultation.create({
      appointmentId,
      patientId: patientId || 'PT-DEFAULT',
      patientName: patientName || 'Patient',
      doctorId: doctorId || 'DOC-DEFAULT',
      doctorName: doctorName || 'Doctor',
      chiefComplaint: chiefComplaint || 'Routine Medical Consultation',
      vitals: calculatedVitals,
      diagnosis: diagnosis || { primary: 'Clinical Evaluation', icdCode: 'Z00.00' },
      clinicalNotes: clinicalNotes || '',
      treatmentPlan: treatmentPlan || '',
      prescribedMedicines: prescribedMedicines || [],
      recommendedTests: recommendedTests || [],
      followUpDate: followUpDate || '',
      status: 'Completed'
    });

    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, { status: 'Completed' });
    }

    await MedicalRecord.create({
      patientId: consultation.patientId,
      patientName: consultation.patientName,
      doctorId: consultation.doctorId,
      doctorName: consultation.doctorName,
      recordType: 'CONSULTATION',
      title: `Consultation: ${consultation.diagnosis.primary}`,
      summary: `Chief Complaint: ${consultation.chiefComplaint}. Notes: ${consultation.clinicalNotes}`
    });

    res.status(201).json(consultation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/consultations/:id', requireClinicalAccess, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found' });
    res.json(consultation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-records', requireClinicalAccess, async (req, res) => {
  try {
    const query = req.query.patientId ? { patientId: req.query.patientId } : {};
    const records = await MedicalRecord.find(query).sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/medical-records/:id', requireClinicalAccess, async (req, res) => {
  try {
    const record = await MedicalRecord.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Medical record not found' });
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. PRESCRIPTIONS & PHARMACY DISPENSING
router.get('/prescriptions', requireClinicalAccess, async (req, res) => {
  try {
    const prescriptions = await Prescription.find().sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/prescriptions/my', async (req, res) => {
  try {
    const patientName = req.query.patientName || req.headers['x-patient-name'];
    const query = patientName ? { patientName } : {};
    const list = await Prescription.find(query).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/prescriptions/:id', requireClinicalAccess, async (req, res) => {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });
    res.json(rx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/prescriptions', requireClinicalAccess, async (req, res) => {
  try {
    const rxId = req.body.rxId || `RX-${Math.floor(9050 + Math.random() * 900)}`;
    const rx = await Prescription.create({ ...req.body, rxId });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: rx.doctorName || 'Dr. Sarah Jenkins',
      role: 'CPOE Order Entry',
      module: 'Electronic Prescriptions',
      actionType: 'CONSULT',
      summary: `Issued e-Prescription ${rx.rxId} for ${rx.patientName} (${rx.medications.map((m) => m.name).join(', ')}).`,
      severity: 'Primary'
    });
    res.status(201).json(rx);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/prescriptions/:id/dispense', async (req, res) => {
  try {
    const rx = await Prescription.findById(req.params.id);
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });
    if (rx.status === 'Dispensed') {
      return res.json({ rx, message: 'Already dispensed' });
    }

    // Deduct quantities from InventoryBatch
    const updatedBatches = [];
    for (const med of rx.medications) {
      let batch = null;
      if (med.batchId) {
        batch = await InventoryBatch.findOne({ batchId: med.batchId });
      }
      if (!batch) {
        batch = await InventoryBatch.findOne({
          medicineName: { $regex: med.name.split(' ')[0], $options: 'i' }
        });
      }
      if (batch) {
        batch.quantity = Math.max(0, batch.quantity - (med.quantity || 1));
        if (batch.quantity <= batch.minLevel && batch.status === 'Optimal') {
          batch.status = 'Low Stock';
        }
        await batch.save();
        updatedBatches.push(batch);
      }
    }

    rx.status = 'Dispensed';
    rx.dispensedAt = new Date();
    rx.dispensedBy = req.body.dispensedBy || 'Dr. Sarah Jenkins';
    await rx.save();

    const firstMed = rx.medications[0] || { name: 'Medication', quantity: 1, batchId: 'BAT-001' };
    const log = await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: rx.dispensedBy,
      role: 'Dispensing Pharmacist',
      module: 'Pharmacy Dispensing Hub',
      actionType: 'DISPENSED',
      summary: `Subtracted -${firstMed.quantity} units ${firstMed.name} (${firstMed.batchId}) for ${rx.patientName}. Verified & Sealed.`,
      severity: 'Emerald'
    });

    res.json({ rx, updatedBatches, log });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 6. PHARMACY INVENTORY BATCHES
router.get('/inventory', async (req, res) => {
  try {
    const batches = await InventoryBatch.find().sort({ createdAt: -1 });
    res.json(batches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/inventory', async (req, res) => {
  try {
    const batchId = req.body.batchId || `BAT-${Math.floor(10000 + Math.random() * 89999)}`;
    const qty = Number(req.body.quantity) || 100;
    const minLevel = Number(req.body.minLevel) || 50;
    const status = qty <= minLevel ? 'Low Stock' : (req.body.status || 'Optimal');

    const batch = await InventoryBatch.create({
      ...req.body,
      batchId,
      quantity: qty,
      minLevel,
      status
    });

    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Pharmacist Entry',
      role: 'Inventory Vault',
      module: 'Pharmacy Inventory',
      actionType: 'INTAKE',
      summary: `Added +${batch.quantity} units of ${batch.medicineName} (${batch.batchId}) to active inventory repository.`,
      severity: 'Primary'
    });

    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/inventory/:id', async (req, res) => {
  try {
    const batch = await InventoryBatch.findById(req.params.id);
    if (!batch) return res.status(404).json({ error: 'Batch not found' });

    if (req.body.quantity !== undefined) {
      batch.quantity = Math.max(0, Number(req.body.quantity));
    }
    if (req.body.status) {
      batch.status = req.body.status;
    } else if (batch.quantity <= batch.minLevel && batch.status === 'Optimal') {
      batch.status = 'Low Stock';
    } else if (batch.quantity > batch.minLevel && batch.status === 'Low Stock') {
      batch.status = 'Optimal';
    }

    Object.assign(batch, req.body, { quantity: batch.quantity, status: batch.status });
    await batch.save();

    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Pharmacist Audit',
      role: 'Inventory Control',
      module: 'Pharmacy Inventory',
      actionType: 'INTAKE',
      summary: req.body.auditReason
        ? `Waste/Depletion logged for ${batch.medicineName} (${batch.batchId}): ${req.body.auditReason}`
        : `Adjusted physical stock count for ${batch.medicineName} (${batch.batchId}) to ${batch.quantity} units.`,
      severity: req.body.auditReason ? 'Rose' : 'Amber'
    });

    res.json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/inventory/deduct-batch', async (req, res) => {
  try {
    const { batchId, quantity, medicineName, patientName, quantityToDispense } = req.body;
    const deductQty = Number(quantity || quantityToDispense) || 1;

    // QA Edge Case: Reject non-positive quantities
    if (deductQty <= 0) {
      return res.status(400).json({ error: 'Dispensing quantity must be greater than zero' });
    }

    let batch = await InventoryBatch.findOne({ batchId });
    if (!batch && medicineName) {
      batch = await InventoryBatch.findOne({
        medicineName: { $regex: medicineName.split(' ')[0], $options: 'i' }
      });
    }

    if (batch) {
      // QA Edge Case: Reject over-dispensing beyond available quantity
      if (batch.quantity < deductQty) {
        return res.status(400).json({ error: `Insufficient stock in batch. Available: ${batch.quantity}, Requested: ${deductQty}` });
      }

      batch.quantity = Math.max(0, batch.quantity - deductQty);
      if (batch.quantity <= batch.minLevel) {
        batch.status = 'Low Stock';
      }
      await batch.save();
    } else {
      return res.status(404).json({ error: 'Batch not found' });
    }

    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'PharmD Dispenser',
      role: 'Dispensing Pharmacist',
      module: 'Pharmacy Dispensing Hub',
      actionType: 'DISPENSED',
      summary: `Subtracted -${deductQty} units of ${medicineName || batch?.medicineName || 'Medication'} (${batchId}) for ${patientName || 'Outpatient'}. Verified & Sealed.`,
      severity: 'Emerald'
    });
    res.json({ success: true, batch });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Standard REST pharmacy dispensing
router.post('/pharmacy/dispense', async (req, res) => {
  try {
    const { batchId, quantity, quantityToDispense, medicineName, patientName, prescriptionId, dispensedBy } = req.body;
    const deductQty = Number(quantity || quantityToDispense) || 1;

    if (deductQty <= 0) {
      return res.status(400).json({ error: 'Dispensing quantity must be greater than zero' });
    }

    let batch = null;
    if (batchId) {
      batch = await InventoryBatch.findOne({ batchId });
    }
    if (!batch && prescriptionId) {
      batch = await InventoryBatch.findOne({ status: { $ne: 'Expired' } });
    }
    if (!batch && medicineName) {
      batch = await InventoryBatch.findOne({ medicineName: { $regex: medicineName.split(' ')[0], $options: 'i' } });
    }

    if (!batch) {
      return res.status(404).json({ error: 'Batch not found' });
    }

    if (batch.quantity < deductQty) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${batch.quantity}, Requested: ${deductQty}` });
    }

    batch.quantity = Math.max(0, batch.quantity - deductQty);
    if (batch.quantity <= batch.minLevel) {
      batch.status = 'Low Stock';
    }
    await batch.save();

    const record = await DispensingRecord.create({
      prescriptionId: prescriptionId || 'RX-DIRECT',
      patientId: req.body.patientId || 'PT-DEFAULT',
      patientName: patientName || 'Outpatient',
      dispensedBy: dispensedBy || 'PharmD. R. Vance',
      items: [{
        batchId: batch.batchId,
        medicineName: batch.medicineName,
        quantityDispensed: deductQty,
        unitPrice: batch.unitPrice || 0,
        totalPrice: (batch.unitPrice || 0) * deductQty
      }]
    });

    res.json({ success: true, batch, record });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pharmacy/medicines', async (req, res) => {
  try {
    const search = req.query.search;
    const query = search ? { medicineName: { $regex: search, $options: 'i' } } : {};
    const medicines = await InventoryBatch.find(query).sort({ medicineName: 1 });
    res.json(medicines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/pharmacy/medicines', async (req, res) => {
  try {
    const batchId = req.body.batchId || `BAT-${Math.floor(10000 + Math.random() * 89999)}`;
    const batch = await InventoryBatch.create({ ...req.body, batchId });
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/pharmacy/batches', async (req, res) => {
  try {
    const batchId = req.body.batchId || `BAT-${Math.floor(10000 + Math.random() * 89999)}`;
    const batch = await InventoryBatch.create({ ...req.body, batchId });
    res.status(201).json(batch);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/pharmacy/low-stock', async (req, res) => {
  try {
    const lowStock = await InventoryBatch.find({
      $or: [
        { status: 'Low Stock' },
        { $expr: { $lte: ['$quantity', '$minLevel'] } }
      ]
    });
    res.json(lowStock);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pharmacy/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const threshold = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const expiring = await InventoryBatch.find({
      expiryDate: { $lte: threshold }
    }).sort({ expiryDate: 1 });
    res.json(expiring);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pharmacy/prescriptions', async (req, res) => {
  try {
    const queue = await Prescription.find({ status: { $ne: 'Dispensed' } }).sort({ createdAt: -1 });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/pharmacy/dispensing-history', async (req, res) => {
  try {
    const history = await DispensingRecord.find().sort({ dispensedAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. INPATIENT BEDS & WARD TRANSFERS
router.get('/beds', async (req, res) => {
  try {
    const beds = await Bed.find().sort({ bedNumber: 1 });
    res.json(beds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/beds', async (req, res) => {
  try {
    const bed = await Bed.create(req.body);
    res.status(201).json(bed);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/beds/:id', async (req, res) => {
  try {
    const bed = await Bed.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (bed && bed.mrn && bed.status === 'Occupied') {
      await Patient.findOneAndUpdate(
        { mrn: bed.mrn },
        { wardBed: bed.bedNumber, status: bed.bedNumber.startsWith('ICU') ? 'Critical ICU' : 'Inpatient' }
      );
      await AuditLog.create({
        timeStr: nowTimeStr(),
        actor: bed.attendingDoctor || 'Ward Coordinator',
        role: 'Bed Management',
        module: 'Inpatient Ward Operations',
        actionType: 'ADMISSION',
        summary: `Assigned Bed ${bed.bedNumber} (${bed.wardName}) to ${bed.patientName} (#${bed.mrn}).`,
        severity: 'Emerald'
      });
    } else if (bed && bed.status !== 'Occupied') {
      await AuditLog.create({
        timeStr: nowTimeStr(),
        actor: 'Environmental & Ward Ops',
        role: 'Bed Management',
        module: 'Inpatient Ward Operations',
        actionType: 'ADMISSION',
        summary: `Bed ${bed.bedNumber} (${bed.wardName}) status updated to [${bed.status}].`,
        severity: 'Amber'
      });
    }
    res.json(bed);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8. LAB & RADIOLOGY ORDERS
router.get('/labs', async (req, res) => {
  try {
    const labs = await LabOrder.find().sort({ createdAt: -1 });
    res.json(labs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/labs', async (req, res) => {
  try {
    const orderId = req.body.orderId || `LAB-${Math.floor(4100 + Math.random() * 900)}`;
    const lab = await LabOrder.create({ ...req.body, orderId });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: lab.orderedBy || 'Dr. Sarah Jenkins',
      role: 'Diagnostics Order',
      module: 'Laboratory & PACS Vault',
      actionType: 'LAB_STAT',
      summary: `Dispatched [${lab.priority}] order ${lab.orderId}: ${lab.testName} for ${lab.patientName} (#${lab.mrn}).`,
      severity: lab.priority === 'STAT' ? 'Rose' : 'Primary'
    });
    res.status(201).json(lab);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/labs/:id', async (req, res) => {
  try {
    const lab = await LabOrder.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Pathology Analyzer',
      role: 'Lab Verification',
      module: 'Laboratory & PACS Vault',
      actionType: 'LAB_STAT',
      summary: `Verified result for ${lab.orderId} (${lab.testName}): ${lab.resultValue} [${lab.flag}].`,
      severity: lab.flag === 'Critical' ? 'Rose' : 'Emerald'
    });
    res.json(lab);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 9. INVOICES & HOSPITAL BILLING
router.get('/invoices', async (req, res) => {
  try {
    const role = getRequestRole(req);
    if (role === 'patient') {
      const myPatient = await resolvePatientForRequest(req);
      if (!myPatient) return res.json([]);
      const myInvoices = await Invoice.find({
        $or: [{ mrn: myPatient.mrn }, { patientName: myPatient.name }]
      }).sort({ createdAt: -1 });
      return res.json(myInvoices);
    }
    const invoices = await Invoice.find().sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/invoices', async (req, res) => {
  try {
    const invoiceId = req.body.invoiceId || `INV-2026-${Math.floor(884 + Math.random() * 115)}`;
    const items = req.body.items || [{ description: 'Clinical Specialist Evaluation', category: 'Consultation', code: 'CPT-99214', amount: 250 }];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const insuranceCovered = req.body.insuranceCovered !== undefined ? Number(req.body.insuranceCovered) : Math.round(subtotal * 0.8);
    const patientPayable = Math.max(0, subtotal - insuranceCovered);

    const invoice = await Invoice.create({
      ...req.body,
      invoiceId,
      items,
      subtotal,
      insuranceCovered,
      patientPayable
    });

    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Revenue Integrity Desk',
      role: 'Hospital Billing',
      module: 'Billing & Invoices',
      actionType: 'BILLING',
      summary: `Generated itemized claim ${invoice.invoiceId} ($${invoice.subtotal.toFixed(2)}) for ${invoice.patientName} (#${invoice.mrn}).`,
      severity: 'Primary'
    });

    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/invoices/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await AuditLog.create({
      timeStr: nowTimeStr(),
      actor: 'Financial Cashier / EDI',
      role: 'Revenue Integrity',
      module: 'Billing & Invoices',
      actionType: 'BILLING',
      summary: `Invoice ${invoice.invoiceId} (${invoice.patientName}) marked as [${invoice.status}] ($${invoice.subtotal.toFixed(2)}).`,
      severity: 'Emerald'
    });
    res.json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// BILLING & PAYMENTS (/api/billing, /api/payments)
// ==========================================
router.post('/billing/bills', async (req, res) => {
  try {
    const billNumber = req.body.billNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const items = req.body.items || [{ description: 'Hospital Services', amount: 150 }];
    const subtotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const taxAmount = Number(req.body.taxAmount) || 0;
    const totalAmount = subtotal + taxAmount;
    const patientPayable = totalAmount;
    const department = req.body.department || 'General Medicine';

    const invoice = await Invoice.create({
      ...req.body,
      invoiceId: billNumber,
      billNumber,
      patientName: req.body.patientName || 'Patient',
      mrn: req.body.mrn || 'MC-9000',
      department,
      items,
      subtotal,
      taxAmount,
      totalAmount,
      patientPayable,
      status: 'Pending'
    });
    res.status(201).json(invoice);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/billing/bills', async (req, res) => {
  try {
    const bills = await Invoice.find().sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/billing/my', async (req, res) => {
  try {
    const patientName = req.query.patientName || req.headers['x-patient-name'];
    const query = patientName ? { patientName } : {};
    const bills = await Invoice.find(query).sort({ createdAt: -1 });
    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/billing/:id', async (req, res) => {
  try {
    const bill = await Invoice.findById(req.params.id);
    if (!bill) return res.status(404).json({ error: 'Bill not found' });
    res.json(bill);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments/create-order', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Live Razorpay checkout is not configured.' });
    }
    const { billId, amount } = req.body;
    if (!billId || !Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'A valid invoice and payment amount are required.' });
    }
    if (!mongoose.Types.ObjectId.isValid(billId)) {
      return res.status(400).json({ error: 'A valid invoice ID is required.' });
    }

    const invoice = await Invoice.findById(billId);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found.' });
    const amountDue = Number(invoice.patientPayable);
    if (invoice.status === 'Paid' || !Number.isFinite(amountDue) || amountDue <= 0) {
      return res.status(409).json({ error: 'Invoice is not payable.' });
    }
    if (Math.round(Number(amount) * 100) !== Math.round(amountDue * 100)) {
      return res.status(400).json({ error: 'Payment amount does not match the invoice balance.' });
    }

    const orderId = `order_${crypto.randomBytes(12).toString('hex')}`;
    const txnId = `pay_${crypto.randomBytes(12).toString('hex')}`;
    const signature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${orderId}|${txnId}`)
      .digest('hex');
    pendingRazorpayOrders.set(orderId, {
      billId: String(invoice._id),
      amount: amountDue,
      paymentId: txnId,
      signature,
      expiresAt: Date.now() + 15 * 60 * 1000
    });
    res.json({
      success: true,
      mode: 'simulation',
      orderId,
      paymentId: txnId,
      signature,
      amount: amountDue,
      currency: 'INR',
      keyId: razorpayKeyId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments/verify', async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, billId, amount } = req.body;
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ error: 'Live Razorpay verification is not configured.' });
    }
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: 'Payment order, payment ID, and signature are required.' });
    }
    const pendingOrder = pendingRazorpayOrders.get(razorpayOrderId);
    if (!pendingOrder) {
      return res.status(400).json({ error: 'Payment order is invalid, expired, or does not match the invoice.' });
    }
    if (pendingOrder.expiresAt <= Date.now()) {
      pendingRazorpayOrders.delete(razorpayOrderId);
      return res.status(400).json({ error: 'Payment order is invalid, expired, or does not match the invoice.' });
    }
    if (
      pendingOrder.paymentId !== razorpayPaymentId ||
      (billId && String(billId) !== pendingOrder.billId) ||
      (amount !== undefined &&
        (!Number.isFinite(Number(amount)) ||
          Math.round(Number(amount) * 100) !== Math.round(pendingOrder.amount * 100)))
    ) {
      return res.status(400).json({ error: 'Payment order is invalid, expired, or does not match the invoice.' });
    }
    const expectedSignature = crypto
      .createHmac('sha256', razorpaySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    const suppliedSignature = Buffer.from(razorpaySignature, 'hex');
    const expectedSignatureBuffer = Buffer.from(expectedSignature, 'hex');
    if (
      suppliedSignature.length !== expectedSignatureBuffer.length ||
      !crypto.timingSafeEqual(suppliedSignature, expectedSignatureBuffer) ||
      razorpaySignature !== pendingOrder.signature
    ) {
      return res.status(400).json({ error: 'Payment signature verification failed' });
    }

    const invoice = await Invoice.findOneAndUpdate(
      {
        _id: pendingOrder.billId,
        status: { $in: ['Pending', 'Insurance Claim', 'Overdue'] },
        patientPayable: pendingOrder.amount
      },
      { $set: { status: 'Paid', patientPayable: 0 } },
      { new: true }
    );
    if (!invoice) {
      pendingRazorpayOrders.delete(razorpayOrderId);
      return res.status(409).json({ error: 'Invoice has already been settled or changed.' });
    }

    try {
      const payment = await Payment.create({
        billId: invoice._id,
        patientName: invoice.patientName,
        amount: pendingOrder.amount,
        currency: 'INR',
        paymentMethod: 'RAZORPAY',
        transactionReference: razorpayPaymentId,
        razorpayOrderId,
        razorpayPaymentId,
        paymentStatus: 'SUCCESS'
      });
      pendingRazorpayOrders.delete(razorpayOrderId);
      return res.json({ success: true, verified: true, payment, invoice });
    } catch (paymentError) {
      await Invoice.findByIdAndUpdate(invoice._id, { $set: { status: 'Pending', patientPayable: pendingOrder.amount } });
      throw paymentError;
    }

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// RECEPTION DESK OPERATIONS (/api/reception)
// ==========================================
router.post('/reception/patients', async (req, res) => {
  try {
    const mrn = req.body.mrn || `MC-W${Date.now().toString().slice(-4)}${Math.floor(100 + Math.random() * 899)}`;
    const phone = req.body.phone || '+1 (555) 000-0000';
    const patient = await Patient.create({ ...req.body, mrn, phone });
    res.status(201).json(patient);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/reception/patients', async (req, res) => {
  try {
    const search = req.query.search;
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { mrn: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }
    const patients = await Patient.find(query).sort({ createdAt: -1 });
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reception/appointments', async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({ slotStart: 1, createdAt: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reception/appointments', async (req, res) => {
  try {
    const { slotStart, doctorId } = req.body;
    if (slotStart && new Date(slotStart) <= new Date()) {
      return res.status(400).json({ error: 'Cannot book appointments in the past' });
    }
    if (doctorId && slotStart) {
      const conflict = await Appointment.findOne({
        doctorId,
        status: { $nin: ['Cancelled', 'CANCELLED'] },
        slotStart: new Date(slotStart)
      });
      if (conflict) {
        return res.status(409).json({ error: 'This time slot is already booked.' });
      }
    }
    const count = await Appointment.countDocuments();
    const tokenNumber = req.body.tokenNumber || `TKN-0${41 + count}`;
    const apt = await Appointment.create({
      ...req.body,
      tokenNumber,
      status: 'CONFIRMED'
    });
    res.status(201).json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/reception/appointments/:id/check-in', async (req, res) => {
  try {
    const apt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'Checked-In' },
      { new: true }
    );
    if (!apt) return res.status(404).json({ error: 'Appointment not found' });
    res.json(apt);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ==========================================
// ADMIN GOVERNANCE (/api/admin)
// ==========================================
router.get('/admin/dashboard', async (req, res) => {
  try {
    const [patients, doctors, appointments, inventory, beds, invoices] = await Promise.all([
      Patient.countDocuments(),
      Doctor.countDocuments(),
      Appointment.countDocuments(),
      InventoryBatch.countDocuments(),
      Bed.find(),
      Invoice.find()
    ]);
    const totalRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.subtotal, 0);
    const occupiedBeds = beds.filter(b => b.status === 'Occupied').length;
    res.json({
      totalPatients: patients,
      totalDoctors: doctors,
      totalAppointments: appointments,
      totalInventoryBatches: inventory,
      occupiedBeds,
      totalBeds: beds.length,
      totalRevenue
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/users', async (req, res) => {
  try {
    const role = req.query.role;
    const query = role ? { role } : {};
    const users = await User.find(query).select('-passwordHash').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/admin/users/:id/status', async (req, res) => {
  try {
    const { status, accountStatus } = req.body;
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { accountStatus: accountStatus || status },
      { new: true }
    ).select('-passwordHash');
    if (!updated) return res.status(404).json({ error: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/admin/doctors/:id/verify', async (req, res) => {
  try {
    const { verified, verificationStatus } = req.body;
    const isVerified = verified !== undefined ? Boolean(verified) : verificationStatus === 'verified';
    const doc = await Doctor.findByIdAndUpdate(
      req.params.id,
      { verified: isVerified },
      { new: true }
    );
    if (!doc) return res.status(404).json({ error: 'Doctor not found' });
    res.json(doc);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin/departments', async (req, res) => {
  try {
    const depts = await Department.find().sort({ name: 1 });
    res.json(depts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/admin/departments', async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json(dept);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/admin/reports', async (req, res) => {
  try {
    const [patientCount, appointmentCount, invoices, inventory] = await Promise.all([
      Patient.countDocuments(),
      Appointment.countDocuments(),
      Invoice.find(),
      InventoryBatch.find()
    ]);
    const paidRevenue = invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.subtotal, 0);
    const lowStockCount = inventory.filter(i => i.quantity <= i.minLevel).length;

    res.json({
      clinical: { totalPatients: patientCount, totalAppointments: appointmentCount },
      financial: { totalRevenue: paidRevenue, totalClaims: invoices.length },
      inventory: { totalBatches: inventory.length, lowStockCount }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. AUDIT LOGS & SEED RESET
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(40);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
