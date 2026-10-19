const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config({ path: __dirname + '/.env' });

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'medicare_salt_secret').digest('hex');
}

async function populateEngagedHospitalOperations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI not set in environment or server/.env');
  }

  console.log('Connecting to MongoDB Atlas at', uri.replace(/:\/\/.*@/, '://<credentials>@'));
  await mongoose.connect(uri);
  console.log('Connected successfully to MongoDB Atlas.');

  const Patient = require('./models/Patient');
  const Doctor = require('./models/Doctor');
  const User = require('./models/User');
  const Appointment = require('./models/Appointment');
  const Prescription = require('./models/Prescription');
  const Invoice = require('./models/Invoice');
  const Bed = require('./models/Bed');
  const LabOrder = require('./models/LabOrder');
  const AuditLog = require('./models/AuditLog');
  const Department = require('./models/Department');
  const DoctorAvailability = require('./models/DoctorAvailability');
  const InventoryBatch = require('./models/InventoryBatch');

  // 1. ENSURE FOUNDATIONAL 5 ACCOUNTS REMAIN PERFECTLY SYNCED & VERIFIED
  console.log('Verifying & updating 5 core foundational role accounts...');
  const coreAccounts = [
    { name: 'System Administrator', email: 'admin@medicare.test', pass: 'Admin123!', role: 'admin', phone: '+1 (555) 100-0001' },
    { name: 'Dr. Sarah Jenkins', email: 'doctor@medicare.test', pass: 'Doctor123!', role: 'doctor', phone: '+1 (555) 200-0002' },
    { name: 'Marcus Vance', email: 'patient@medicare.test', pass: 'Patient123!', role: 'patient', phone: '+1 (555) 234-8821' },
    { name: 'Triage Receptionist', email: 'receptionist@medicare.test', pass: 'Reception123!', role: 'receptionist', phone: '+1 (555) 400-0004' },
    { name: 'PharmD. R. Vance', email: 'pharmacist@medicare.test', pass: 'Pharmacy123!', role: 'pharmacist', phone: '+1 (555) 500-0005' }
  ];

  for (const acc of coreAccounts) {
    await User.findOneAndUpdate(
      { email: acc.email },
      {
        name: acc.name,
        email: acc.email,
        passwordHash: hashPassword(acc.pass),
        role: acc.role,
        phone: acc.phone,
        accountStatus: 'active'
      },
      { upsert: true, new: true }
    );
  }

  // 2. CLINICAL DEPARTMENTS
  console.log('Upserting specialized clinical departments...');
  const departments = [
    { name: 'Endocrinology & Metabolism', code: 'ENDO', headDoctorName: 'Dr. Aris Thorne', staffCount: 15, roomCount: 8, description: 'Metabolic, Diabetes Mellitus, and Thyroid Care' },
    { name: 'Rheumatology & Immunology', code: 'RHEUM', headDoctorName: 'Dr. Maya Patel', staffCount: 12, roomCount: 6, description: 'Autoimmune, Lupus, and Arthritis Care' },
    { name: 'Gastroenterology & Hepatology', code: 'GI', headDoctorName: 'Dr. Fatima Zahra', staffCount: 18, roomCount: 10, description: 'Digestive, Liver, and IBD Therapeutics' },
    { name: 'Cardiology Wing', code: 'CARDIO', headDoctorName: 'Dr. Sarah Jenkins', staffCount: 24, roomCount: 16, description: 'Interventional Cardiology, Heart Failure & CCU' },
    { name: 'Neurology Dept', code: 'NEURO', headDoctorName: 'Dr. Julian Vance', staffCount: 18, roomCount: 12, description: 'Neurovascular, Epilepsy, MS & Parkinson Care' },
    { name: 'Pulmonology & ICU', code: 'PULMO', headDoctorName: 'Dr. Elena Vance-Kerr', staffCount: 20, roomCount: 14, description: 'Respiratory Care, Ventilator Support & Critical Care' },
    { name: 'Nephrology & Dialysis', code: 'NEPHRO', headDoctorName: 'Dr. Samuel Osei', staffCount: 14, roomCount: 8, description: 'Renal Failure, Dialysis Center & Hypertension' },
    { name: 'Surgical & OR Suite', code: 'SURG', headDoctorName: 'Dr. Rebecca Lin', staffCount: 28, roomCount: 10, description: 'General, Laparoscopic & Cardiothoracic Surgery' }
  ];

  for (const dept of departments) {
    await Department.findOneAndUpdate({ name: dept.name }, dept, { upsert: true, new: true });
  }

  // 3. MULTIPLE SPECIALIZED DOCTORS
  console.log('Upserting specialized medical doctors...');
  const newDoctors = [
    {
      employeeId: 'EMP-9011',
      name: 'Dr. Aris Thorne',
      email: 'dr.thorne@medicare.test',
      specialty: 'Endocrinology & Diabetology',
      department: 'Endocrinology & Metabolism',
      qualification: 'MD, FACE, ECNU',
      roleTitle: 'Senior Endocrinologist',
      room: 'Suite 208-B',
      shiftHours: '08:30 - 17:30',
      status: 'On Duty',
      consultationFee: 210,
      patientsToday: 9,
      maxCapacity: 18,
      verified: true,
      licenseNo: 'NPI-8829011',
      availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM']
    },
    {
      employeeId: 'EMP-9012',
      name: 'Dr. Maya Patel',
      email: 'dr.patel@medicare.test',
      specialty: 'Rheumatology & Autoimmune',
      department: 'Rheumatology & Immunology',
      qualification: 'MD, FACR, RhMSUS',
      roleTitle: 'Director of Autoimmune Therapies',
      room: 'Suite 412-C',
      shiftHours: '09:00 - 18:00',
      status: 'On Duty',
      consultationFee: 230,
      patientsToday: 11,
      maxCapacity: 16,
      verified: true,
      licenseNo: 'NPI-8829012',
      availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM']
    },
    {
      employeeId: 'EMP-9013',
      name: 'Dr. Kenji Sato',
      email: 'dr.sato@medicare.test',
      specialty: 'Cardiothoracic Surgery',
      department: 'Surgical & OR Suite',
      qualification: 'MD, FACS, FACC',
      roleTitle: 'Chief of Cardiothoracic Surgery',
      room: 'OR-Suite 4',
      shiftHours: '07:00 - 16:00',
      status: 'In Surgery',
      consultationFee: 350,
      patientsToday: 4,
      maxCapacity: 8,
      verified: true,
      licenseNo: 'NPI-8829013',
      availableSlots: ['11:00 AM', '03:00 PM']
    },
    {
      employeeId: 'EMP-9014',
      name: 'Dr. Fatima Zahra',
      email: 'dr.zahra@medicare.test',
      specialty: 'Gastroenterology & IBD',
      department: 'Gastroenterology & Hepatology',
      qualification: 'MD, FACG, AGAF',
      roleTitle: 'Lead Gastroenterologist',
      room: 'Suite 315-A',
      shiftHours: '08:00 - 17:00',
      status: 'In Consultation',
      consultationFee: 220,
      patientsToday: 13,
      maxCapacity: 20,
      verified: true,
      licenseNo: 'NPI-8829014',
      availableSlots: ['10:00 AM', '01:30 PM', '03:00 PM', '04:30 PM']
    },
    {
      employeeId: 'EMP-9015',
      name: 'Dr. Gregory House-Cole',
      email: 'dr.housecole@medicare.test',
      specialty: 'Infectious Disease & Internal Medicine',
      department: 'General Medicine',
      qualification: 'MD, FIDSA, DTM&H',
      roleTitle: 'Chief Infectious Disease Specialist',
      room: 'Suite 110-D',
      shiftHours: '10:00 - 19:00',
      status: 'On Call',
      consultationFee: 240,
      patientsToday: 6,
      maxCapacity: 14,
      verified: true,
      licenseNo: 'NPI-8829015',
      availableSlots: ['11:30 AM', '02:00 PM', '05:00 PM']
    }
  ];

  for (const doc of newDoctors) {
    const { email, ...docData } = doc;
    await Doctor.findOneAndUpdate({ employeeId: doc.employeeId }, docData, { upsert: true, new: true });
    
    // Doctor user login account
    await User.findOneAndUpdate(
      { email },
      {
        name: doc.name,
        email,
        passwordHash: hashPassword('Doctor123!'),
        role: 'doctor',
        phone: '+1 (555) 700-' + doc.employeeId.slice(-4),
        accountStatus: 'active'
      },
      { upsert: true, new: true }
    );

    // Doctor availability
    await DoctorAvailability.findOneAndUpdate(
      { doctorName: doc.name },
      {
        doctorId: doc.employeeId,
        doctorName: doc.name,
        department: doc.department,
        workingDays: [1, 2, 3, 4, 5],
        startTime: '08:30',
        endTime: '17:30',
        slotDuration: 30,
        isActive: true
      },
      { upsert: true, new: true }
    );
  }

  // 4. MULTIPLE PATIENTS WITH MULTIPLE DISEASES, SOAP NOTES, VITALS, AND ALLERGIES
  console.log('Upserting multi-disease clinical patient cases...');
  const multiDiseasePatients = [
    {
      mrn: 'MC-8871',
      name: 'Sophia Chen',
      age: 32,
      dob: '18 Nov 1992',
      gender: 'Female',
      bloodGroup: 'B+ Positive',
      phone: '+1 (555) 345-8871',
      email: 'sophia.chen@patient.medicare.test',
      allergies: ['Sulfa Drugs', 'Gluten'],
      chronicConditions: [
        'Type 1 Diabetes Mellitus with DKA history (E10.10)',
        'Hashimoto Autoimmune Thyroiditis (E06.3)',
        'Celiac Disease (K90.0)'
      ],
      department: 'Endocrinology & Metabolism',
      attendingDoctor: 'Dr. Aris Thorne',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'BlueCross Highmark PPO',
      insurancePolicyNo: 'BC-55102-S',
      vitals: { bp: '118/74', hr: 78, spo2: 99, temp: '36.9°C', respRate: 15, weight: '58.2 kg' },
      clinicalNotes: [
        {
          date: '2026-10-18 10:15',
          doctor: 'Dr. Aris Thorne',
          chiefComplaint: 'HbA1c elevation to 8.4% with nocturnal hypoglycemia episodes on insulin pump.',
          soapNote: 'S: 32yo female with T1D x 14 years and Hashimoto thyroiditis. Frequent nighttime sensor alarms. O: TSH 3.8 uIU/mL, Free T4 1.2 ng/dL, Dexcom CGM 90-day GMI 8.2%. A: Brittle Type 1 Diabetes with recurrent hypoglycemia (E10.65), Primary Hypothyroidism (E03.9). P: Adjust basal overnight profile from 0.85 U/hr to 0.70 U/hr. Continue Levothyroxine 88mcg po daily.',
          icd10: 'E10.65'
        }
      ]
    },
    {
      mrn: 'MC-8872',
      name: 'Robert Kowalski',
      age: 64,
      dob: '05 Jan 1960',
      gender: 'Male',
      bloodGroup: 'A+ Positive',
      phone: '+1 (555) 456-8872',
      email: 'robert.kowalski@patient.medicare.test',
      allergies: ['Penicillin', 'Ceftriaxone'],
      chronicConditions: [
        'Severe COPD with Acute Exacerbation (J44.1)',
        'Cor Pulmonale with Pulmonary Hypertension (I27.9)',
        'Severe Nicotine Dependence (F17.210)'
      ],
      department: 'Pulmonology & ICU',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      wardBed: 'ICU-201',
      status: 'Inpatient',
      acuity: 'Rose',
      insuranceProvider: 'Medicare Part A & B',
      insurancePolicyNo: 'MED-99412-K',
      vitals: { bp: '142/88', hr: 104, spo2: 89, temp: '38.1°C', respRate: 26, weight: '76.5 kg' },
      clinicalNotes: [
        {
          date: '2026-10-19 06:30',
          doctor: 'Dr. Elena Vance-Kerr',
          chiefComplaint: 'Acute dyspnea, pursed-lip breathing, productive greenish sputum for 3 days.',
          soapNote: 'S: Patient in moderate respiratory distress on HFNC 40L 45% FiO2. O: ABG: pH 7.31, pCO2 58, pO2 64, HCO3 30. CXR: Hyperinflated lung fields, flattened diaphragms, right lower lobe opacity. A: Severe COPD exacerbation with acute respiratory acidosis (J44.1), secondary bacterial pneumonia (J18.9). P: IV Methylprednisolone 60mg q12h, Duoneb q4h, IV Levofloxacin 750mg daily, continuous ICU telemetry monitoring.',
          icd10: 'J44.1'
        }
      ]
    },
    {
      mrn: 'MC-8873',
      name: 'Amina Al-Mansoor',
      age: 41,
      dob: '12 Sep 1983',
      gender: 'Female',
      bloodGroup: 'O- Negative',
      phone: '+1 (555) 567-8873',
      email: 'amina.mansoor@patient.medicare.test',
      allergies: ['Aspirin', 'Codeine'],
      chronicConditions: [
        'Relapsing-Remitting Multiple Sclerosis (G35)',
        'Retrobulbar Optic Neuritis (H46.1)',
        'Central Neuropathic Pain Syndrome (M79.2)'
      ],
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'Aetna Premier Health',
      insurancePolicyNo: 'AET-77192-M',
      vitals: { bp: '122/78', hr: 74, spo2: 98, temp: '36.7°C', respRate: 14, weight: '63.8 kg' },
      clinicalNotes: [
        {
          date: '2026-10-18 14:00',
          doctor: 'Dr. Julian Vance',
          chiefComplaint: 'Bilateral lower extremity paresthesias and right visual blurring on heat exposure (Uhthoff phenomenon).',
          soapNote: 'S: 41yo female with RRMS since 2019. EDSS score 2.5. O: Contrast 3T Brain MRI demonstrates 3 new Dawson fingers lesions in corpus callosum. Visual acuity 20/40 OD. A: Active Multiple Sclerosis with radiological disease progression (G35). P: Scheduled for semi-annual Ocrelizumab 300mg IV infusion. Start Gabapentin 300mg po tid for dysesthesias.',
          icd10: 'G35'
        }
      ]
    },
    {
      mrn: 'MC-8874',
      name: 'Carlos Mendez',
      age: 58,
      dob: '29 Mar 1966',
      gender: 'Male',
      bloodGroup: 'B- Negative',
      phone: '+1 (555) 678-8874',
      email: 'carlos.mendez@patient.medicare.test',
      allergies: ['Lisinopril (Angioedema)', 'NSAIDs'],
      chronicConditions: [
        'Chronic Kidney Disease Stage 4 (N18.4)',
        'Hypertensive Arteriosclerotic Nephropathy (I12.9)',
        'Renal Osteodystrophy & Secondary Hyperparathyroidism (E21.1)'
      ],
      department: 'Nephrology & Dialysis',
      attendingDoctor: 'Dr. Samuel Osei',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'UnitedHealthcare Choice Plus',
      insurancePolicyNo: 'UHC-48190-C',
      vitals: { bp: '158/96', hr: 82, spo2: 97, temp: '36.8°C', respRate: 16, weight: '88.0 kg' },
      clinicalNotes: [
        {
          date: '2026-10-17 11:30',
          doctor: 'Dr. Samuel Osei',
          chiefComplaint: 'Progression of bilateral pedal edema and elevated serum creatinine.',
          soapNote: 'S: 58yo male with longstanding hypertension and CKD-4. O: BP 158/96, eGFR 22 mL/min/1.73m2, Creatinine 2.84 mg/dL, Potassium 5.1 mEq/L, PTH 210 pg/mL. A: Severe CKD Stage 4 (N18.4), uncontrolled hypertension (I12.9). P: Vascular surgery referral for left radiocephalic AV Fistula creation. Prescribe Sevelamer carbonate 800mg with meals, Furosemide 40mg daily, low-potassium renal diet.',
          icd10: 'N18.4'
        }
      ]
    },
    {
      mrn: 'MC-8875',
      name: 'Chloe Bennett',
      age: 29,
      dob: '04 Jul 1995',
      gender: 'Female',
      bloodGroup: 'A- Negative',
      phone: '+1 (555) 789-8875',
      email: 'chloe.bennett@patient.medicare.test',
      allergies: ['Sulfa Drugs', 'Ibuprofen'],
      chronicConditions: [
        'Systemic Lupus Erythematosus with Lupus Nephritis Class IV (M32.14)',
        'Antiphospholipid Antibody Syndrome (D68.61)',
        'Inflammatory Polyarthritis with Raynaud Phenomenon (I73.0)'
      ],
      department: 'Rheumatology & Immunology',
      attendingDoctor: 'Dr. Maya Patel',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'Cigna Global Health',
      insurancePolicyNo: 'CG-88129-B',
      vitals: { bp: '134/86', hr: 86, spo2: 99, temp: '37.4°C', respRate: 16, weight: '55.4 kg' },
      clinicalNotes: [
        {
          date: '2026-10-18 15:45',
          doctor: 'Dr. Maya Patel',
          chiefComplaint: 'Facial malar rash flare, morning stiffness > 90 mins, 2+ proteinuria on urinalysis.',
          soapNote: 'S: 29yo female presenting with active SLE flare. O: Anti-dsDNA positive at 1:640, C3 low at 58 mg/dL, C4 low at 9 mg/dL. Urine protein-to-creatinine ratio 1.8. A: Active SLE flare with diffuse proliferative lupus nephritis (M32.14). P: Initiate Mycophenolate Mofetil 1000mg bid, continue Hydroxychloroquine 200mg bid, Prednisone taper starting 40mg daily with Calcium/Vit-D protection.',
          icd10: 'M32.14'
        }
      ]
    },
    {
      mrn: 'MC-8876',
      name: 'Dmitri Volkov',
      age: 69,
      dob: '15 Oct 1955',
      gender: 'Male',
      bloodGroup: 'AB+ Positive',
      phone: '+1 (555) 890-8876',
      email: 'dmitri.volkov@patient.medicare.test',
      allergies: ['Iodinated Radiocontrast (Severe Hives)'],
      chronicConditions: [
        'Ischemic Cardiomyopathy with HFrEF EF 28% (I50.22)',
        'Severe 3-Vessel Coronary Artery Disease post-CABG (I25.10)',
        'Paroxysmal Atrial Fibrillation on Anticoagulation (I48.0)'
      ],
      department: 'Cardiology Wing',
      attendingDoctor: 'Dr. Sarah Jenkins',
      wardBed: 'CCU-302',
      status: 'Critical ICU',
      acuity: 'Rose',
      insuranceProvider: 'Medicare Blue Shield PPO',
      insurancePolicyNo: 'MED-55021-V',
      vitals: { bp: '104/68', hr: 88, spo2: 93, temp: '36.6°C', respRate: 22, weight: '79.1 kg' },
      clinicalNotes: [
        {
          date: '2026-10-19 08:20',
          doctor: 'Dr. Sarah Jenkins',
          chiefComplaint: 'Orthopnea requiring 4 pillows, paroxysmal nocturnal dyspnea, JVD to angle of mandible.',
          soapNote: 'S: 69yo male with decompensated heart failure and atrial fibrillation. O: NT-proBNP 4,890 pg/mL, Transthoracic Echo confirms LVEF 28% with global hypokinesis. A: Acute on chronic systolic heart failure NYHA Class IV (I50.23). P: CCU Telemetry admission. Continuous IV Furosemide infusion at 10mg/hr, Sacubitril/Valsartan (Entresto) 24/26mg bid, Carvedilol 6.25mg bid, Empagliflozin 10mg daily.',
          icd10: 'I50.23'
        }
      ]
    },
    {
      mrn: 'MC-8877',
      name: 'Maya Lin-Sterling',
      age: 22,
      dob: '24 Jan 2002',
      gender: 'Female',
      bloodGroup: 'O+ Positive',
      phone: '+1 (555) 901-8877',
      email: 'maya.sterling@patient.medicare.test',
      allergies: ['Ciprofloxacin', 'Metronidazole'],
      chronicConditions: [
        'Crohn Disease of Terminal Ileum with Stricture (K50.012)',
        'Severe Iron Deficiency Anemia (D50.0)',
        'Erythema Nodosum with Peripheral Arthritis (L52)'
      ],
      department: 'Gastroenterology & Hepatology',
      attendingDoctor: 'Dr. Fatima Zahra',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'BlueCross Anthem Select',
      insurancePolicyNo: 'BC-91204-M',
      vitals: { bp: '110/70', hr: 92, spo2: 99, temp: '37.3°C', respRate: 14, weight: '49.5 kg' },
      clinicalNotes: [
        {
          date: '2026-10-18 16:30',
          doctor: 'Dr. Fatima Zahra',
          chiefComplaint: 'Post-prandial right lower quadrant cramping, 6 liquid stools daily, extreme fatigue.',
          soapNote: 'S: 22yo female with ileal Crohns disease. O: Hemoglobin 8.8 g/dL, Ferritin 6 ng/mL, Fecal Calprotectin 840 ug/g. MR Enterography confirms 11cm stricture with upstream dilatation. A: Active stenosing Crohns disease (K50.012), profound iron deficiency anemia (D50.0). P: Schedule IV Monoferric 1000mg infusion. Start Adalimumab 160mg subcutaneous induction followed by 80mg at week 2.',
          icd10: 'K50.012'
        }
      ]
    },
    {
      mrn: 'MC-8878',
      name: 'Arthur Pendelton',
      age: 78,
      dob: '19 Feb 1946',
      gender: 'Male',
      bloodGroup: 'A+ Positive',
      phone: '+1 (555) 012-8878',
      email: 'arthur.pendelton@patient.medicare.test',
      allergies: ['Metoclopramide', 'Haloperidol'],
      chronicConditions: [
        'Idiopathic Parkinson Disease with Motor Fluctuations (G20)',
        'Normal Pressure Hydrocephalus with Gait Ataxia (G91.2)',
        'Severe Bilateral Knee Osteoarthritis (M17.0)'
      ],
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      wardBed: 'EMU-401A',
      status: 'Inpatient',
      acuity: 'Amber',
      insuranceProvider: 'Medicare Senior Advantage',
      insurancePolicyNo: 'MED-66120-P',
      vitals: { bp: '138/82', hr: 68, spo2: 97, temp: '36.8°C', respRate: 15, weight: '71.0 kg' },
      clinicalNotes: [
        {
          date: '2026-10-19 09:10',
          doctor: 'Dr. Julian Vance',
          chiefComplaint: 'Frequent freezing of gait, progressive magnetic shuffling, urinary urgency.',
          soapNote: 'S: 78yo male admitted for diagnostic CSF tap test. O: Brain MRI demonstrates Evans index 0.36 with disproportionate ventricular enlargement. Pre-tap timed 10-meter walk: 24 seconds with 32 steps. A: Normal Pressure Hydrocephalus (G91.2) co-existing with Parkinsons Disease (G20). P: 40mL high-volume lumbar puncture performed. Post-tap walk improved to 16 seconds (33% improvement). Neurosurgery consult requested for VP shunt placement.',
          icd10: 'G91.2'
        }
      ]
    }
  ];

  for (const pat of multiDiseasePatients) {
    const { email, ...patData } = pat;
    await Patient.findOneAndUpdate({ mrn: pat.mrn }, patData, { upsert: true, new: true });

    // Patient user login account
    await User.findOneAndUpdate(
      { email },
      {
        name: pat.name,
        email,
        passwordHash: hashPassword('Patient123!'),
        role: 'patient',
        phone: pat.phone,
        accountStatus: 'active'
      },
      { upsert: true, new: true }
    );
  }

  // 5. APPOINTMENTS ENGAGING THE WORKFLOW
  console.log('Upserting operational clinical appointments...');
  const appointments = [
    {
      bookingReference: 'BK-99101',
      tokenNumber: 'TKN-4101',
      patientId: 'MC-8871',
      doctorId: 'EMP-9011',
      patientName: 'Sophia Chen',
      mrn: 'MC-8871',
      doctorName: 'Dr. Aris Thorne',
      department: 'Endocrinology & Metabolism',
      date: '2026-10-19',
      timeSlot: '10:30 AM',
      visitType: 'New Consultation',
      priority: 'Urgent',
      status: 'CONFIRMED',
      room: 'Suite 208-B',
      waitMinutes: 8,
      reason: 'Continuous Glucose Monitor review & nocturnal hypoglycemia titration'
    },
    {
      bookingReference: 'BK-99102',
      tokenNumber: 'TKN-4102',
      patientId: 'MC-8872',
      doctorId: 'EMP-9012',
      patientName: 'Robert Kowalski',
      mrn: 'MC-8872',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pulmonology & ICU',
      date: '2026-10-19',
      timeSlot: '08:00 AM',
      visitType: 'Emergency Triage',
      priority: 'STAT',
      status: 'IN_CONSULTATION',
      room: 'ICU-201',
      waitMinutes: 0,
      reason: 'Acute COPD Exacerbation with Hypercapnic Acidosis'
    },
    {
      bookingReference: 'BK-99103',
      tokenNumber: 'TKN-4103',
      patientId: 'MC-8873',
      doctorId: 'EMP-8820',
      patientName: 'Amina Al-Mansoor',
      mrn: 'MC-8873',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      date: '2026-10-19',
      timeSlot: '02:00 PM',
      visitType: 'Follow-up',
      priority: 'Urgent',
      status: 'CONFIRMED',
      room: 'Suite 402',
      waitMinutes: 12,
      reason: 'Post-MRI active MS relapse assessment and Ocrelizumab authorization'
    },
    {
      bookingReference: 'BK-99104',
      tokenNumber: 'TKN-4104',
      patientId: 'MC-8874',
      doctorId: 'EMP-8825',
      patientName: 'Carlos Mendez',
      mrn: 'MC-8874',
      doctorName: 'Dr. Samuel Osei',
      department: 'Nephrology & Dialysis',
      date: '2026-10-19',
      timeSlot: '11:30 AM',
      visitType: 'Pre-Op Check',
      priority: 'Routine',
      status: 'CHECKED_IN',
      room: 'Suite 305',
      waitMinutes: 15,
      reason: 'Pre-operative vascular mapping for arteriovenous fistula (AVF)'
    },
    {
      bookingReference: 'BK-99105',
      tokenNumber: 'TKN-4105',
      patientId: 'MC-8875',
      doctorId: 'EMP-9012',
      patientName: 'Chloe Bennett',
      mrn: 'MC-8875',
      doctorName: 'Dr. Maya Patel',
      department: 'Rheumatology & Immunology',
      date: '2026-10-19',
      timeSlot: '03:30 PM',
      visitType: 'New Consultation',
      priority: 'Urgent',
      status: 'CONFIRMED',
      room: 'Suite 412-C',
      waitMinutes: 5,
      reason: 'Lupus Nephritis Class IV induction with Mycophenolate Mofetil'
    },
    {
      bookingReference: 'BK-99106',
      tokenNumber: 'TKN-4106',
      patientId: 'MC-8876',
      doctorId: 'EMP-8819',
      patientName: 'Dmitri Volkov',
      mrn: 'MC-8876',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      date: '2026-10-19',
      timeSlot: '09:00 AM',
      visitType: 'Emergency Triage',
      priority: 'STAT',
      status: 'IN_CONSULTATION',
      room: 'CCU-302',
      waitMinutes: 0,
      reason: 'Acute decompensated HFrEF with severe orthopnea and JVD'
    },
    {
      bookingReference: 'BK-99107',
      tokenNumber: 'TKN-4107',
      patientId: 'MC-8877',
      doctorId: 'EMP-9014',
      patientName: 'Maya Lin-Sterling',
      mrn: 'MC-8877',
      doctorName: 'Dr. Fatima Zahra',
      department: 'Gastroenterology & Hepatology',
      date: '2026-10-19',
      timeSlot: '01:30 PM',
      visitType: 'New Consultation',
      priority: 'Urgent',
      status: 'CONFIRMED',
      room: 'Suite 315-A',
      waitMinutes: 10,
      reason: 'Ileal Crohns stricture biologic therapy induction & iron infusion'
    },
    {
      bookingReference: 'BK-99108',
      tokenNumber: 'TKN-4108',
      patientId: 'MC-8878',
      doctorId: 'EMP-8820',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8878',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      date: '2026-10-19',
      timeSlot: '04:00 PM',
      visitType: 'Follow-up',
      priority: 'Routine',
      status: 'CONFIRMED',
      room: 'EMU-401A',
      waitMinutes: 0,
      reason: 'Post-lumbar tap evaluation and neurosurgical VP shunt recommendation'
    }
  ];

  for (const appt of appointments) {
    await Appointment.findOneAndUpdate({ bookingReference: appt.bookingReference }, appt, { upsert: true, new: true });
  }

  // 6. INVENTORY BATCHES FOR NEW MEDICATIONS
  console.log('Upserting inventory batches for specialty medications...');
  const batches = [
    {
      batchId: 'BAT-33810',
      medicineName: 'Insulin Glargine (Lantus) 100U/mL Pen',
      formulation: 'Subcutaneous Injectable',
      category: 'GENERAL',
      ndc: 'NDC-0088-2220-33',
      manufacturer: 'Sanofi-Aventis',
      quantity: 180,
      minLevel: 50,
      unitPrice: 94.50,
      expiryDate: '2027-08-30',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-33811',
      medicineName: 'Tiotropium Bromide (Spiriva) 2.5mcg',
      formulation: 'Inhalation Aerosol',
      category: 'RESP',
      ndc: 'NDC-0597-0160-61',
      manufacturer: 'Boehringer Ingelheim',
      quantity: 85,
      minLevel: 30,
      unitPrice: 125.00,
      expiryDate: '2027-11-15',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-33812',
      medicineName: 'Mycophenolate Mofetil (CellCept) 500mg',
      formulation: 'Capsule · Oral',
      category: 'GENERAL',
      ndc: 'NDC-0004-0259-01',
      manufacturer: 'Genentech Roche',
      quantity: 320,
      minLevel: 80,
      unitPrice: 42.00,
      expiryDate: '2028-01-20',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-33813',
      medicineName: 'Sacubitril/Valsartan (Entresto) 24/26mg',
      formulation: 'Film-Coated Tablet · Oral',
      category: 'CARDIO',
      ndc: 'NDC-0078-0659-20',
      manufacturer: 'Novartis Pharma',
      quantity: 210,
      minLevel: 60,
      unitPrice: 168.00,
      expiryDate: '2027-09-10',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-33814',
      medicineName: 'Adalimumab (Humira) 40mg/0.4mL Pen',
      formulation: 'Subcutaneous Auto-Injector',
      category: 'GENERAL',
      ndc: 'NDC-0074-4339-02',
      manufacturer: 'AbbVie Biotech',
      quantity: 45,
      minLevel: 20,
      unitPrice: 840.00,
      expiryDate: '2027-06-18',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-33815',
      medicineName: 'Carbidopa/Levodopa 25/100mg CR',
      formulation: 'Controlled-Release Tablet · Oral',
      category: 'NEURO',
      ndc: 'NDC-0054-0043-25',
      manufacturer: 'Hikma Pharmaceuticals',
      quantity: 410,
      minLevel: 100,
      unitPrice: 18.50,
      expiryDate: '2028-04-12',
      status: 'Optimal'
    }
  ];

  for (const b of batches) {
    await InventoryBatch.findOneAndUpdate({ batchId: b.batchId }, b, { upsert: true, new: true });
  }

  // 7. MULTIPLE DETAILED PRESCRIPTIONS
  console.log('Upserting clinical prescriptions matching chronic conditions...');
  const prescriptions = [
    {
      rxId: 'RX-99101',
      patientName: 'Sophia Chen',
      mrn: 'MC-8871',
      doctorName: 'Dr. Aris Thorne',
      department: 'Endocrinology & Metabolism',
      diagnosis: 'Brittle Type 1 Diabetes Mellitus with DKA history (E10.10)',
      icd10: 'E10.10',
      priority: 'Urgent',
      status: 'Pending',
      medications: [
        { name: 'Insulin Glargine (Lantus) 100U/mL Pen', dosage: '22 Units', frequency: 'SubQ at bedtime', duration: '90 Days', quantity: 3, batchId: 'BAT-33810' },
        { name: 'Insulin Lispro (Humalog) 100U/mL', dosage: '1 Unit per 10g carbs', frequency: 'SubQ with meals', duration: '90 Days', quantity: 4, batchId: 'BAT-33810' }
      ]
    },
    {
      rxId: 'RX-99102',
      patientName: 'Robert Kowalski',
      mrn: 'MC-8872',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pulmonology & ICU',
      diagnosis: 'Acute Severe Exacerbation of COPD with Bronchospasm (J44.1)',
      icd10: 'J44.1',
      priority: 'STAT',
      status: 'Dispensed',
      dispensedAt: new Date(),
      dispensedBy: 'PharmD. R. Vance',
      medications: [
        { name: 'Tiotropium Bromide (Spiriva) 2.5mcg', dosage: '2 Puffs', frequency: 'Daily Inhalation', duration: '30 Days', quantity: 1, batchId: 'BAT-33811' },
        { name: 'Albuterol Sulfate HFA 90mcg', dosage: '2 Puffs q4h prn', frequency: 'Inhalation as needed', duration: '30 Days', quantity: 2, batchId: 'BAT-88123' },
        { name: 'Methylprednisolone 4mg Dosepak', dosage: 'Taper as directed', frequency: 'Oral with meals', duration: '6 Days', quantity: 21, batchId: 'BAT-44201' }
      ]
    },
    {
      rxId: 'RX-99103',
      patientName: 'Carlos Mendez',
      mrn: 'MC-8874',
      doctorName: 'Dr. Samuel Osei',
      department: 'Nephrology & Dialysis',
      diagnosis: 'Severe CKD Stage 4 with Hypertensive Nephropathy (N18.4)',
      icd10: 'N18.4',
      priority: 'Routine',
      status: 'Pending',
      medications: [
        { name: 'Sevelamer Carbonate 800mg', dosage: '800mg tid', frequency: 'Oral with meals', duration: '60 Days', quantity: 180, batchId: 'BAT-77312' },
        { name: 'Furosemide 40mg', dosage: '40mg daily', frequency: 'Oral in morning', duration: '60 Days', quantity: 60, batchId: 'BAT-77312' }
      ]
    },
    {
      rxId: 'RX-99104',
      patientName: 'Chloe Bennett',
      mrn: 'MC-8875',
      doctorName: 'Dr. Maya Patel',
      department: 'Rheumatology & Immunology',
      diagnosis: 'Systemic Lupus Erythematosus with Lupus Nephritis Class IV (M32.14)',
      icd10: 'M32.14',
      priority: 'Urgent',
      status: 'Pending',
      medications: [
        { name: 'Mycophenolate Mofetil 500mg', dosage: '1000mg bid', frequency: 'Oral twice daily on empty stomach', duration: '60 Days', quantity: 120, batchId: 'BAT-33812' },
        { name: 'Hydroxychloroquine 200mg', dosage: '200mg bid', frequency: 'Oral with meals', duration: '90 Days', quantity: 180, batchId: 'BAT-77312' },
        { name: 'Prednisone 20mg', dosage: '20mg daily', frequency: 'Oral morning with breakfast', duration: '30 Days', quantity: 30, batchId: 'BAT-44201' }
      ]
    },
    {
      rxId: 'RX-99105',
      patientName: 'Dmitri Volkov',
      mrn: 'MC-8876',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      diagnosis: 'Heart Failure with Reduced Ejection Fraction NYHA IV (I50.23)',
      icd10: 'I50.23',
      priority: 'STAT',
      status: 'Dispensed',
      dispensedAt: new Date(),
      dispensedBy: 'PharmD. R. Vance',
      medications: [
        { name: 'Sacubitril/Valsartan (Entresto) 24/26mg', dosage: '1 Tablet bid', frequency: 'Oral twice daily', duration: '30 Days', quantity: 60, batchId: 'BAT-33813' },
        { name: 'Apixaban (Eliquis) 5mg', dosage: '5mg bid', frequency: 'Oral twice daily', duration: '60 Days', quantity: 120, batchId: 'BAT-54109' },
        { name: 'Atorvastatin Calcium 20mg', dosage: '80mg daily', frequency: 'Oral at bedtime', duration: '90 Days', quantity: 90, batchId: 'BAT-77312' }
      ]
    },
    {
      rxId: 'RX-99106',
      patientName: 'Maya Lin-Sterling',
      mrn: 'MC-8877',
      doctorName: 'Dr. Fatima Zahra',
      department: 'Gastroenterology & Hepatology',
      diagnosis: 'Terminal Ileal Crohns Stricture & Microcytic Anemia (K50.012)',
      icd10: 'K50.012',
      priority: 'Urgent',
      status: 'Pending',
      medications: [
        { name: 'Adalimumab (Humira) 40mg/0.4mL Pen', dosage: '80mg bi-weekly', frequency: 'Subcutaneous injection', duration: '60 Days', quantity: 4, batchId: 'BAT-33814' }
      ]
    },
    {
      rxId: 'RX-99107',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8878',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      diagnosis: 'Idiopathic Parkinson Disease with Motor On-Off Fluctuations (G20)',
      icd10: 'G20',
      priority: 'Routine',
      status: 'Dispensed',
      dispensedAt: new Date(),
      dispensedBy: 'PharmD. R. Vance',
      medications: [
        { name: 'Carbidopa/Levodopa 25/100mg CR', dosage: '1 Tablet qid', frequency: 'Oral 30 mins before meals', duration: '60 Days', quantity: 240, batchId: 'BAT-33815' }
      ]
    }
  ];

  for (const rx of prescriptions) {
    await Prescription.findOneAndUpdate({ rxId: rx.rxId }, rx, { upsert: true, new: true });
  }

  // 8. BED ALLOCATIONS & INPATIENT TELEMETRY
  console.log('Upserting hospital bed assignments & clinical telemetry...');
  const beds = [
    {
      bedNumber: 'ICU-201',
      wardName: 'Medical Intensive Care Unit (MICU)',
      floor: 'Floor 2 · East Wing',
      bedType: 'ICU Telemetry',
      status: 'Occupied',
      patientName: 'Robert Kowalski',
      mrn: 'MC-8872',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      acuity: 'Rose',
      admittedAt: '2026-10-19 06:15',
      diagnosis: 'Acute Respiratory Failure & Severe COPD Exacerbation',
      ventilatorActive: true
    },
    {
      bedNumber: 'CCU-302',
      wardName: 'Cardiac Care Unit (CCU)',
      floor: 'Floor 3 · North Wing',
      bedType: 'Cardiac Step-Down',
      status: 'Occupied',
      patientName: 'Dmitri Volkov',
      mrn: 'MC-8876',
      attendingDoctor: 'Dr. Sarah Jenkins',
      acuity: 'Rose',
      admittedAt: '2026-10-19 07:45',
      diagnosis: 'Decompensated Heart Failure NYHA-IV with Atrial Fibrillation',
      ventilatorActive: false
    },
    {
      bedNumber: 'EMU-401A',
      wardName: 'Epilepsy & Neuromuscular Unit',
      floor: 'Floor 4 · West Wing',
      bedType: 'General Inpatient',
      status: 'Occupied',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8878',
      attendingDoctor: 'Dr. Julian Vance',
      acuity: 'Amber',
      admittedAt: '2026-10-18 19:30',
      diagnosis: 'Normal Pressure Hydrocephalus Diagnostic Tap Protocol',
      ventilatorActive: false
    },
    {
      bedNumber: 'SURG-102',
      wardName: 'Surgical & PACU Step-Down',
      floor: 'Floor 1 · Surgical Wing',
      bedType: 'Surgical Recovery',
      status: 'Occupied',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      attendingDoctor: 'Dr. Rebecca Lin',
      acuity: 'Amber',
      admittedAt: '2026-10-18 22:00',
      diagnosis: 'Post-Laparoscopic Appendectomy PACU Monitoring',
      ventilatorActive: false
    },
    {
      bedNumber: 'ICU-202',
      wardName: 'Medical Intensive Care Unit (MICU)',
      floor: 'Floor 2 · East Wing',
      bedType: 'ICU Telemetry',
      status: 'Available',
      patientName: '',
      mrn: '',
      attendingDoctor: '',
      acuity: 'None',
      admittedAt: '',
      diagnosis: '',
      ventilatorActive: false
    },
    {
      bedNumber: 'CCU-303',
      wardName: 'Cardiac Care Unit (CCU)',
      floor: 'Floor 3 · North Wing',
      bedType: 'Cardiac Step-Down',
      status: 'Available',
      patientName: '',
      mrn: '',
      attendingDoctor: '',
      acuity: 'None',
      admittedAt: '',
      diagnosis: '',
      ventilatorActive: false
    }
  ];

  for (const b of beds) {
    await Bed.findOneAndUpdate({ bedNumber: b.bedNumber }, b, { upsert: true, new: true });
  }

  // 9. STAT & ROUTINE LAB ORDERS & BIOMARKER PANELS
  console.log('Upserting diagnostic laboratory panels and STAT orders...');
  const labOrders = [
    {
      orderId: 'LAB-99101',
      patientName: 'Sophia Chen',
      mrn: 'MC-8871',
      testName: 'Hemoglobin A1c & Serum Fructosamine',
      category: 'Biochemistry',
      priority: 'Routine',
      orderedBy: 'Dr. Aris Thorne',
      status: 'Completed',
      resultValue: 'HbA1c 8.4% (Fructosamine 380 umol/L)',
      referenceRange: '4.0 - 5.6 %',
      flag: 'High'
    },
    {
      orderId: 'LAB-99102',
      patientName: 'Robert Kowalski',
      mrn: 'MC-8872',
      testName: 'Arterial Blood Gas (ABG) & Lactate',
      category: 'Hematology',
      priority: 'STAT',
      orderedBy: 'Dr. Elena Vance-Kerr',
      status: 'Critical Alert',
      resultValue: 'pH 7.31, pCO2 58 mmHg, pO2 64 mmHg, Lactate 2.4 mmol/L',
      referenceRange: 'pH 7.35-7.45, pCO2 35-45 mmHg',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-99103',
      patientName: 'Carlos Mendez',
      mrn: 'MC-8874',
      testName: 'Comprehensive Renal Function & Electrolyte Panel',
      category: 'Biochemistry',
      priority: 'Urgent',
      orderedBy: 'Dr. Samuel Osei',
      status: 'Completed',
      resultValue: 'Creatinine 2.84 mg/dL, eGFR 22, Potassium 5.1 mEq/L, BUN 46 mg/dL',
      referenceRange: 'Creatinine 0.7-1.3 mg/dL, eGFR > 60',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-99104',
      patientName: 'Chloe Bennett',
      mrn: 'MC-8875',
      testName: 'Anti-dsDNA, C3/C4 Complement & Urine Protein/Cr Ratio',
      category: 'Pathology Biopsy',
      priority: 'Urgent',
      orderedBy: 'Dr. Maya Patel',
      status: 'Completed',
      resultValue: 'Anti-dsDNA 1:640 (High), C3 58 mg/dL (Low), UPCR 1.8 g/g',
      referenceRange: 'Anti-dsDNA < 1:10, C3 90-180 mg/dL',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-99105',
      patientName: 'Dmitri Volkov',
      mrn: 'MC-8876',
      testName: 'STAT High-Sensitivity Troponin-I & NT-proBNP',
      category: 'Cardiac Biomarkers',
      priority: 'STAT',
      orderedBy: 'Dr. Sarah Jenkins',
      status: 'Critical Alert',
      resultValue: 'NT-proBNP 4,890 pg/mL, hs-cTnI 0.082 ng/mL',
      referenceRange: 'NT-proBNP < 300 pg/mL, hs-cTnI < 0.014 ng/mL',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-99106',
      patientName: 'Maya Lin-Sterling',
      mrn: 'MC-8877',
      testName: 'Fecal Calprotectin & Quantitative Serum Ferritin',
      category: 'Microbiology',
      priority: 'Urgent',
      orderedBy: 'Dr. Fatima Zahra',
      status: 'Completed',
      resultValue: 'Fecal Calprotectin 840 ug/g, Ferritin 6 ng/mL',
      referenceRange: 'Calprotectin < 50 ug/g, Ferritin 20-200 ng/mL',
      flag: 'High'
    },
    {
      orderId: 'LAB-99107',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8878',
      testName: 'CSF Oligoclonal Bands, Protein & Opening Pressure',
      category: 'Hematology',
      priority: 'Urgent',
      orderedBy: 'Dr. Julian Vance',
      status: 'Completed',
      resultValue: 'Opening Pressure 160 mm H2O (Normal), CSF Protein 38 mg/dL',
      referenceRange: 'Pressure 100-200 mm H2O, Protein 15-45 mg/dL',
      flag: 'Normal'
    }
  ];

  for (const lab of labOrders) {
    await LabOrder.findOneAndUpdate({ orderId: lab.orderId }, lab, { upsert: true, new: true });
  }

  // 10. ITEMIZED INVOICES & BILLING OPERATIONS
  console.log('Upserting patient billing invoices & insurance claims...');
  const invoices = [
    {
      invoiceId: 'INV-99101',
      patientName: 'Sophia Chen',
      mrn: 'MC-8871',
      department: 'Endocrinology & Metabolism',
      attendingDoctor: 'Dr. Aris Thorne',
      items: [
        { description: 'Comprehensive Outpatient Endocrine Evaluation', category: 'Clinical Service', code: 'CPT-99205', amount: 320 },
        { description: 'Continuous Glucose Monitor (CGM) Sensor Calibration & Analysis', category: 'Diagnostic', code: 'CPT-95251', amount: 145 },
        { description: 'Hemoglobin A1c Point of Care Assay', category: 'Laboratory', code: 'CPT-83036', amount: 65 }
      ],
      subtotal: 530,
      taxAmount: 0,
      insuranceCovered: 450.50,
      patientPayable: 79.50,
      paymentMethod: 'BlueCross Highmark EDI Claim',
      status: 'Insurance Claim',
      issuedDate: '2026-10-18'
    },
    {
      invoiceId: 'INV-99102',
      patientName: 'Robert Kowalski',
      mrn: 'MC-8872',
      department: 'Pulmonology & ICU',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      items: [
        { description: 'ICU Critical Care Telemetry First Hour', category: 'Critical Care', code: 'CPT-99291', amount: 1250 },
        { description: 'High-Flow Nasal Cannula Ventilatory Management', category: 'Respiratory Therapy', code: 'CPT-94660', amount: 480 },
        { description: 'STAT Arterial Blood Gas (ABG) with Electrolytes', category: 'Laboratory', code: 'CPT-82803', amount: 180 },
        { description: 'Continuous Pulse Oximetry & Telemetry Capnography', category: 'Monitoring', code: 'CPT-94762', amount: 120 }
      ],
      subtotal: 2030,
      taxAmount: 0,
      insuranceCovered: 1827,
      patientPayable: 203,
      paymentMethod: 'Medicare Part A Direct Billing',
      status: 'Pending',
      issuedDate: '2026-10-19'
    },
    {
      invoiceId: 'INV-99103',
      patientName: 'Chloe Bennett',
      mrn: 'MC-8875',
      department: 'Rheumatology & Immunology',
      attendingDoctor: 'Dr. Maya Patel',
      items: [
        { description: 'Complex Autoimmune & Lupus Consult', category: 'Clinical Service', code: 'CPT-99215', amount: 280 },
        { description: 'Anti-dsDNA & Complement Titers (C3, C4)', category: 'Laboratory', code: 'CPT-86225', amount: 240 },
        { description: 'Urine Protein/Creatinine Ratio Panel', category: 'Laboratory', code: 'CPT-82043', amount: 75 }
      ],
      subtotal: 595,
      taxAmount: 0,
      insuranceCovered: 535.50,
      patientPayable: 59.50,
      paymentMethod: 'Cigna Global Health Card',
      status: 'Paid',
      issuedDate: '2026-10-18'
    },
    {
      invoiceId: 'INV-99104',
      patientName: 'Dmitri Volkov',
      mrn: 'MC-8876',
      department: 'Cardiology Wing',
      attendingDoctor: 'Dr. Sarah Jenkins',
      items: [
        { description: 'CCU Cardiac Intensive Resuscitation & Telemetry', category: 'Critical Care', code: 'CPT-99291', amount: 1450 },
        { description: 'Transthoracic Echocardiogram with Doppler (TTE)', category: 'Cardiology Imaging', code: 'CPT-93306', amount: 890 },
        { description: 'STAT hs-Troponin-I and NT-proBNP Biomarker Duo', category: 'Laboratory', code: 'CPT-83880', amount: 220 }
      ],
      subtotal: 2560,
      taxAmount: 0,
      insuranceCovered: 2304,
      patientPayable: 256,
      paymentMethod: 'Medicare Blue Shield PPO',
      status: 'Pending',
      issuedDate: '2026-10-19'
    },
    {
      invoiceId: 'INV-99105',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8878',
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      items: [
        { description: 'Diagnostic High-Volume Lumbar Puncture (Tap Test)', category: 'Neurology Procedure', code: 'CPT-62270', amount: 620 },
        { description: 'CSF Cytology & Neurochemical Profile Analysis', category: 'Laboratory', code: 'CPT-89051', amount: 310 },
        { description: 'Neurological Gait & Cognitive Assessment Battery', category: 'Clinical Evaluation', code: 'CPT-96116', amount: 240 }
      ],
      subtotal: 1170,
      taxAmount: 0,
      insuranceCovered: 1053,
      patientPayable: 117,
      paymentMethod: 'Medicare Senior Advantage',
      status: 'Paid',
      issuedDate: '2026-10-19'
    }
  ];

  for (const inv of invoices) {
    await Invoice.findOneAndUpdate({ invoiceId: inv.invoiceId }, inv, { upsert: true, new: true });
  }

  // 11. AUDIT LOGS DOCUMENTING MULTI-SUBSYSTEM HOSPITAL OPERATIONS
  console.log('Upserting hospital governance and operational audit logs...');
  const auditLogs = [
    {
      timeStr: '2026-10-19 06:20',
      actor: 'Dr. Elena Vance-Kerr',
      role: 'Chief Pulmonologist & Intensivist',
      module: 'ICU Admissions',
      actionType: 'ADMISSION',
      summary: 'Emergency ICU Admission: Robert Kowalski (MC-8872) transferred to Bed ICU-201 on HFNC 45% FiO2.',
      severity: 'Rose'
    },
    {
      timeStr: '2026-10-19 07:15',
      actor: 'Stat Lab Analyzer #02',
      role: 'Automated Diagnostic Core',
      module: 'Pathology Diagnostics',
      actionType: 'LAB_STAT',
      summary: 'CRITICAL ALERT: Arterial Blood Gas for Robert Kowalski returned pH 7.31 / pCO2 58. Attending alerted via telemetry page.',
      severity: 'Rose'
    },
    {
      timeStr: '2026-10-19 08:30',
      actor: 'Dr. Sarah Jenkins',
      role: 'Director of Cardiology',
      module: 'CCU Critical Care',
      actionType: 'CONSULT',
      summary: 'Signed Clinical SOAP Note: Dmitri Volkov (MC-8876) presenting with acute decompensated HFrEF (EF 28%). Initiated Entresto & Milrinone bridge.',
      severity: 'Amber'
    },
    {
      timeStr: '2026-10-19 09:15',
      actor: 'PharmD. R. Vance',
      role: 'Lead Hospital Pharmacist',
      module: 'Inpatient Pharmacy',
      actionType: 'DISPENSED',
      summary: 'Fulfilled STAT Prescription RX-99105 for Dmitri Volkov (Entresto 24/26mg & Apixaban 5mg). Deducted from Batch BAT-33813.',
      severity: 'Emerald'
    },
    {
      timeStr: '2026-10-19 09:40',
      actor: 'Triage Receptionist',
      role: 'Chief Intake Receptionist',
      module: 'Patient Reception',
      actionType: 'INTAKE',
      summary: 'Generated Outpatient Triage Token TKN-4101 for Sophia Chen (MC-8871) for Endocrinology Suite 208-B.',
      severity: 'Primary'
    },
    {
      timeStr: '2026-10-19 10:00',
      actor: 'Dr. Julian Vance',
      role: 'Lead Neurologist',
      module: 'Neurology Procedures',
      actionType: 'CONSULT',
      summary: 'Completed diagnostic high-volume CSF tap test on Arthur Pendelton (MC-8878). 33% gait speed improvement noted.',
      severity: 'Emerald'
    }
  ];

  for (const log of auditLogs) {
    await AuditLog.create(log);
  }

  console.log('Successfully completed full population of hospital operations, patients, doctors, and records!');
  process.exit(0);
}

populateEngagedHospitalOperations().catch(err => {
  console.error('Population error:', err);
  process.exit(1);
});
