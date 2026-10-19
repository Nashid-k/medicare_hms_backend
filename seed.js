const crypto = require('crypto');
const Patient = require('./models/Patient');
const Doctor = require('./models/Doctor');
const Appointment = require('./models/Appointment');
const Prescription = require('./models/Prescription');
const InventoryBatch = require('./models/InventoryBatch');
const Invoice = require('./models/Invoice');
const Bed = require('./models/Bed');
const LabOrder = require('./models/LabOrder');
const AuditLog = require('./models/AuditLog');
const User = require('./models/User');
const Department = require('./models/Department');
const DoctorAvailability = require('./models/DoctorAvailability');

function hashPassword(password) {
  return crypto.createHash('sha256').update(password + 'medicare_salt_secret').digest('hex');
}

async function seedDatabase(force = false) {
  const existingPatients = await Patient.countDocuments();
  if (existingPatients >= 12 && !force) {
    console.log('Database already seeded with full MediCare clinical dummy dataset.');
    return;
  }

  await Promise.all([
    Patient.deleteMany({}),
    Doctor.deleteMany({}),
    Appointment.deleteMany({}),
    Prescription.deleteMany({}),
    InventoryBatch.deleteMany({}),
    Invoice.deleteMany({}),
    Bed.deleteMany({}),
    LabOrder.deleteMany({}),
    AuditLog.deleteMany({}),
    User.deleteMany({}),
    Department.deleteMany({}),
    DoctorAvailability.deleteMany({})
  ]);

  console.log('Seeding comprehensive MediCare Hospital Core OS dummy dataset...');

  // 1. SEED 12 PATIENTS
  await Patient.insertMany([
    {
      mrn: 'MC-8821',
      name: 'Marcus Vance',
      age: 48,
      dob: '14 May 1976',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      phone: '+1 (555) 234-8821',
      email: 'm.vance@clinicalmail.org',
      allergies: ['Penicillin', 'Sulfa Drugs'],
      chronicConditions: ['Unstable Angina (I20.0)', 'Essential Hypertension (I10)'],
      department: 'Cardiology Wing',
      attendingDoctor: 'Dr. Sarah Jenkins',
      wardBed: 'CCU-304A',
      status: 'Active Consult',
      acuity: 'Rose',
      insuranceProvider: 'BlueCross Clinical Shield',
      insurancePolicyNo: 'BC-99281-X',
      vitals: { bp: '146/92', hr: 96, spo2: 96, temp: '37.2°C', respRate: 18, weight: '82.4 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 09:40',
          doctor: 'Dr. Sarah Jenkins',
          chiefComplaint: 'Sub-sternal chest tightness radiating to left shoulder for 2 hours.',
          soapNote: 'S: 48yo male presenting with exertional angina. O: BP 146/92, HR 96, ECG shows mild ST-depression V4-V6. High-sensitivity Troponin-T ordered STAT. A: Unstable Angina Pectoris (I20.0). P: Dual antiplatelet therapy, Atorvastatin 80mg stat, Cardiology telemetry admission.',
          icd10: 'I20.0'
        },
        {
          date: '2026-10-08 16:15',
          doctor: 'Dr. Sarah Jenkins',
          chiefComplaint: 'Baseline Cardiology Lipid & Stress Echo Follow-up.',
          soapNote: 'S: Mild fatigue on stairs. O: LDL 148 mg/dL, EF 55% on echocardiogram. A: Coronary Atherosclerosis (I25.10). P: Increase statin titration and schedule coronary CT angiography.',
          icd10: 'I25.10'
        }
      ]
    },
    {
      mrn: 'MC-8819',
      name: 'Elena Rostova',
      age: 34,
      dob: '22 Aug 1990',
      gender: 'Female',
      bloodGroup: 'A- Negative',
      phone: '+1 (555) 876-4410',
      email: 'elena.rostova@medportal.io',
      allergies: ['Latex'],
      chronicConditions: ['Migraine with Aura (G43.109)', 'Mild Asthma'],
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      wardBed: 'EMU-402B',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'Aetna Premier Health',
      insurancePolicyNo: 'AET-44120-B',
      vitals: { bp: '118/76', hr: 72, spo2: 99, temp: '36.8°C', respRate: 14, weight: '61.0 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 10:15',
          doctor: 'Dr. Julian Vance',
          chiefComplaint: 'Recurrent visual scotoma and unilateral throbbing headache.',
          soapNote: 'S: 3 episodes this week. Photophobia present. O: Cranial nerves II-XII intact, no focal motor deficit. EEG scheduled. A: Intractable Migraine with Aura (G43.119). P: Sumatriptan 50mg PRN, Topiramate prophylaxis initiation.',
          icd10: 'G43.119'
        }
      ]
    },
    {
      mrn: 'MC-8804',
      name: 'Arthur Pendelton',
      age: 67,
      dob: '03 Nov 1957',
      gender: 'Male',
      bloodGroup: 'B+ Positive',
      phone: '+1 (555) 390-1122',
      email: 'a.pendelton@legacy.net',
      allergies: ['Contrast Dye (Iodinated)', 'Aspirin'],
      chronicConditions: ['Type 2 Diabetes Mellitus (E11.9)', 'CKD Stage 3a', 'Atrial Fibrillation'],
      department: 'Cardiology Wing',
      attendingDoctor: 'Dr. Sarah Jenkins',
      wardBed: 'ICU-102B',
      status: 'Critical ICU',
      acuity: 'Rose',
      insuranceProvider: 'Medicare Part A/B Institutional',
      insurancePolicyNo: 'MCR-109283-A',
      vitals: { bp: '154/94', hr: 112, spo2: 94, temp: '37.6°C', respRate: 21, weight: '89.1 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 08:30',
          doctor: 'Dr. Sarah Jenkins',
          chiefComplaint: 'Rapid ventricular response AFib and dyspnea on exertion.',
          soapNote: 'S: Palpitations since 05:00 AM. O: Irregularly irregular rhythm at 112 bpm. BNP elevated at 640 pg/mL. A: Paroxysmal Atrial Fibrillation (I48.0). P: IV Diltiazem titration, Apixaban 5mg BID, continuous ICU hemodynamic monitoring.',
          icd10: 'I48.0'
        }
      ]
    },
    {
      mrn: 'MC-8825',
      name: 'Chloe Takahashi',
      age: 29,
      dob: '19 Feb 1995',
      gender: 'Female',
      bloodGroup: 'AB+ Positive',
      phone: '+1 (555) 612-9091',
      email: 'chloe.t@techbio.com',
      allergies: ['None Known (NKDA)'],
      chronicConditions: ['Post-ACL Reconstruction Rehab'],
      department: 'Orthopedics & Trauma',
      attendingDoctor: 'Dr. Marcus Thorne',
      wardBed: 'WARD-208A',
      status: 'Inpatient',
      acuity: 'Emerald',
      insuranceProvider: 'UnitedHealthcare Choice Plus',
      insurancePolicyNo: 'UHC-77821-P',
      vitals: { bp: '114/72', hr: 68, spo2: 99, temp: '36.7°C', respRate: 14, weight: '57.5 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 11:00',
          doctor: 'Dr. Marcus Thorne',
          chiefComplaint: 'Post-Op Day 2 Robotic Knee Arthroscopy & ACL Graft review.',
          soapNote: 'S: Pain well controlled (2/10). O: Incision clean, dry, intact. ROM 0-75 degrees achieved with PT. A: Routine Post-Surgical Orthopedic Recovery (Z47.89). P: Continue physical therapy protocol, discharge planned tomorrow.',
          icd10: 'Z47.89'
        }
      ]
    },
    {
      mrn: 'MC-8830',
      name: 'David K. Sterling',
      age: 55,
      dob: '09 Jul 1969',
      gender: 'Male',
      bloodGroup: 'O- Negative',
      phone: '+1 (555) 741-5539',
      email: 'd.sterling@sterlingcorp.com',
      allergies: ['Codeine'],
      chronicConditions: ['Community-Acquired Pneumonia (J18.9)', 'COPD'],
      department: 'Pulmonology & ICU',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      wardBed: 'WARD-410C',
      status: 'Inpatient',
      acuity: 'Amber',
      insuranceProvider: 'Cigna HealthSpring',
      insurancePolicyNo: 'CIG-55219-M',
      vitals: { bp: '132/84', hr: 88, spo2: 93, temp: '38.3°C', respRate: 22, weight: '76.2 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 11:30',
          doctor: 'Dr. Elena Vance-Kerr',
          chiefComplaint: 'Productive cough, fever 38.3°C, right lower lobe consolidation.',
          soapNote: 'S: Fevers and dyspnea x 4 days. O: Coarse crackles RLL, SpO2 93% on 2L nasal cannula. A: Acute Bacterial Pneumonia (J18.9). P: Amoxicillin-Clavulanate 875mg BID + Azithromycin, Albuterol nebulizer Q6H.',
          icd10: 'J18.9'
        }
      ]
    },
    {
      mrn: 'MC-8834',
      name: 'Sophia Al-Mansoor',
      age: 31,
      dob: '11 Dec 1993',
      gender: 'Female',
      bloodGroup: 'A+ Positive',
      phone: '+1 (555) 998-3112',
      email: 'sophia.almansoor@global.org',
      allergies: ['None Known (NKDA)'],
      chronicConditions: ['High-Risk Twin Gestation (34 Weeks)'],
      department: 'Maternal-Fetal & NICU',
      attendingDoctor: 'Dr. Priya Nair',
      wardBed: 'LD-502A',
      status: 'Inpatient',
      acuity: 'Amber',
      insuranceProvider: 'BlueCross Clinical Shield',
      insurancePolicyNo: 'BC-33109-M',
      vitals: { bp: '126/80', hr: 82, spo2: 99, temp: '36.9°C', respRate: 16, weight: '71.8 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 12:15',
          doctor: 'Dr. Priya Nair',
          chiefComplaint: 'Routine fetal NST monitoring and maternal BP surveillance.',
          soapNote: 'S: Fetal movements active for both Twin A and Twin B. O: Reactive non-stress test (FHR A: 142 bpm, FHR B: 148 bpm). A: Dichorionic-Diamniotic Twin Pregnancy (O30.043). P: Continue inpatient fetal telemetry.',
          icd10: 'O30.043'
        }
      ]
    },
    {
      mrn: 'MC-8839',
      name: 'Viktor Krumlov',
      age: 61,
      dob: '04 Apr 1965',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      phone: '+1 (555) 443-7781',
      email: 'v.krumlov@eurofreight.io',
      allergies: ['Morphine'],
      chronicConditions: ['Stage IIA Non-Small Cell Lung Adenocarcinoma (C34.11)'],
      department: 'Oncology & Infusion',
      attendingDoctor: 'Dr. Hiroshi Tanaka',
      wardBed: 'ONC-601A',
      status: 'Inpatient',
      acuity: 'Amber',
      insuranceProvider: 'Aetna Oncology Network',
      insurancePolicyNo: 'AET-90812-C',
      vitals: { bp: '128/78', hr: 79, spo2: 96, temp: '37.0°C', respRate: 17, weight: '73.5 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 09:00',
          doctor: 'Dr. Hiroshi Tanaka',
          chiefComplaint: 'Cycle 3 Pembrolizumab + Carboplatin Chemo-Immunotherapy Infusion.',
          soapNote: 'S: Mild grade 1 fatigue, no hemoptysis. O: ANC 2,400/µL, Creatinine 0.9 mg/dL, port-a-cath patent with brisk blood return. A: NSCLC Right Upper Lobe (C34.11). P: Administer Pembrolizumab 200mg IV over 30m + Ondansetron pre-med.',
          icd10: 'C34.11'
        }
      ]
    },
    {
      mrn: 'MC-8842',
      name: 'Hannah Lindqvist',
      age: 44,
      dob: '29 Sep 1982',
      gender: 'Female',
      bloodGroup: 'A+ Positive',
      phone: '+1 (555) 819-2044',
      email: 'hannah.l@nordicdesign.se',
      allergies: ['Cephalosporins'],
      chronicConditions: ['End-Stage Renal Disease on Hemodialysis (N18.6)'],
      department: 'Nephrology & Dialysis',
      attendingDoctor: 'Dr. Samuel Osei',
      wardBed: 'HD-BAY-04',
      status: 'Active Consult',
      acuity: 'Amber',
      insuranceProvider: 'UnitedHealthcare Choice Plus',
      insurancePolicyNo: 'UHC-55401-D',
      vitals: { bp: '148/86', hr: 76, spo2: 98, temp: '36.6°C', respRate: 15, weight: '66.4 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 07:45',
          doctor: 'Dr. Samuel Osei',
          chiefComplaint: 'Scheduled 4-hour High-Flux Hemodialysis session & ultrafiltration.',
          soapNote: 'S: Interdialytic weight gain +2.4 kg. O: Left radiocephalic AV fistula thrill strong, bruit continuous. Pre-HD K+ 5.3 mEq/L. A: ESRD on Chronic Hemodialysis (N18.6). P: Target UF 2,500 mL at Qb 400 mL/min, Epoetin alfa 4,000U IV post-run.',
          icd10: 'N18.6'
        }
      ]
    },
    {
      mrn: 'MC-8847',
      name: 'Liam O-Connor',
      age: 24,
      dob: '17 Mar 2002',
      gender: 'Male',
      bloodGroup: 'O- Negative',
      phone: '+1 (555) 302-9918',
      email: 'liam.oconnor@athletics.edu',
      allergies: ['None Known (NKDA)'],
      chronicConditions: ['Acute Appendicitis with Localized Peritonitis (K35.30)'],
      department: 'Surgical & OR Suite',
      attendingDoctor: 'Dr. Rebecca Lin',
      wardBed: 'PACU-03',
      status: 'Inpatient',
      acuity: 'Amber',
      insuranceProvider: 'Kaiser Permanente Select',
      insurancePolicyNo: 'KP-66712-S',
      vitals: { bp: '122/74', hr: 74, spo2: 99, temp: '37.3°C', respRate: 15, weight: '79.0 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 08:10',
          doctor: 'Dr. Rebecca Lin',
          chiefComplaint: 'RLQ rebound tenderness, leukocytosis WBC 15.8k.',
          soapNote: 'S: 14 hours periumbilical pain migrating to McBurney point. O: CT abdomen shows 11mm dilated appendix with periappendiceal fat stranding. A: Acute Non-Perforated Appendicitis (K35.30). P: Emergent Laparoscopic Appendectomy in OR-02, Piperacillin-Tazobactam 3.375g IV.',
          icd10: 'K35.30'
        }
      ]
    },
    {
      mrn: 'MC-8851',
      name: 'Evelyn Hawthorne',
      age: 72,
      dob: '12 Jan 1954',
      gender: 'Female',
      bloodGroup: 'B- Negative',
      phone: '+1 (555) 609-3381',
      email: 'e.hawthorne@heritage.org',
      allergies: ['Shellfish', 'Iodine'],
      chronicConditions: ['Acute Ischemic Middle Cerebral Artery Stroke (I63.511)'],
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      wardBed: 'NICU-201A',
      status: 'Critical ICU',
      acuity: 'Rose',
      insuranceProvider: 'Medicare Part A/B Institutional',
      insurancePolicyNo: 'MCR-77812-N',
      vitals: { bp: '162/90', hr: 84, spo2: 97, temp: '36.9°C', respRate: 17, weight: '64.2 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 06:50',
          doctor: 'Dr. Julian Vance',
          chiefComplaint: 'Sudden onset left hemiparesis and dysarthria, NIHSS score 14.',
          soapNote: 'S: Last known well 05:30 AM. O: CT Perfusion shows right M1 segment occlusion with 65mL salvageable penumbra. Door-to-needle Tenecteplase 24 mins. A: Acute Right MCA Ischemic Stroke (I63.511). P: Mechanical thrombectomy TICI 3 recanalization achieved in Neuro Biplane Suite.',
          icd10: 'I63.511'
        }
      ]
    },
    {
      mrn: 'MC-8855',
      name: 'Noah Patel-enz',
      age: 7,
      dob: '08 May 2019',
      gender: 'Male',
      bloodGroup: 'A+ Positive',
      phone: '+1 (555) 512-8870',
      email: 'parents.patel@familymail.com',
      allergies: ['Peanuts', 'Amoxicillin'],
      chronicConditions: ['Severe Acute Asthma Status Asthmaticus (J45.52)'],
      department: 'Pediatric ICU (PICU)',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      wardBed: 'PICU-04A',
      status: 'Critical ICU',
      acuity: 'Rose',
      insuranceProvider: 'BlueCross Family Shield',
      insurancePolicyNo: 'BC-11298-K',
      vitals: { bp: '102/64', hr: 128, spo2: 94, temp: '37.1°C', respRate: 32, weight: '24.5 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 09:20',
          doctor: 'Dr. Elena Vance-Kerr',
          chiefComplaint: 'Intercostal retractions, wheezing, refractory to home rescue inhaler.',
          soapNote: 'S: Viral URI prodrome x 2 days. O: Diffuse expiratory wheezes, SpO2 94% on HFNC 15L/min FiO2 0.40. A: Status Asthmaticus (J45.52). P: Continuous Albuterol nebulization, IV Methylprednisolone 2mg/kg, Magnesium Sulfate 50mg/kg IV.',
          icd10: 'J45.52'
        }
      ]
    },
    {
      mrn: 'MC-8860',
      name: 'Gabriella Morales',
      age: 39,
      dob: '25 Oct 1986',
      gender: 'Female',
      bloodGroup: 'O+ Positive',
      phone: '+1 (555) 901-4432',
      email: 'g.morales@urbanarch.co',
      allergies: ['NSAIDs (Ibuprofen)'],
      chronicConditions: ['Diabetic Foot Ulcer Grade 2 & Hyperbaric Wound Therapy (E11.621)'],
      department: 'Wound Care & Hyperbaric',
      attendingDoctor: 'Dr. Marcus Thorne',
      wardBed: 'Outpatient',
      status: 'Active Consult',
      acuity: 'Emerald',
      insuranceProvider: 'Cigna Premier',
      insurancePolicyNo: 'CIG-88320-W',
      vitals: { bp: '124/78', hr: 71, spo2: 99, temp: '36.7°C', respRate: 14, weight: '68.0 kg' },
      clinicalNotes: [
        {
          date: '2026-10-09 10:50',
          doctor: 'Dr. Marcus Thorne',
          chiefComplaint: 'HBOT Dive Session #8 & Negative Pressure Wound VAC dressing change.',
          soapNote: 'S: Granulation tissue progressing well. O: Wound dimensions decreased by 35% (1.8cm x 1.2cm), transcutaneous oximetry TcPO2 48 mmHg. A: Neuropathic Plantar Ulcer (E11.621). P: 90-minute HBOT chamber dive at 2.4 ATA, reapply NPWT foam at -125 mmHg.',
          icd10: 'E11.621'
        }
      ]
    }
  ]);

  // 2. SEED 10 DOCTORS
  await Doctor.insertMany([
    {
      employeeId: 'DOC-101',
      name: 'Dr. Sarah Jenkins',
      specialty: 'Interventional Cardiology & Electrophysiology',
      department: 'Cardiology Wing',
      qualification: 'MD, FACC, FSCAI',
      roleTitle: 'Lead Attending · Chief of Cardiology',
      room: 'Suite 304-A · Heart Center',
      shiftHours: '07:00 - 19:00',
      status: 'On Duty',
      consultationFee: 220,
      patientsToday: 14,
      maxCapacity: 18,
      verified: true,
      licenseNo: 'NPI-9948210',
      availableSlots: ['09:30 AM', '10:30 AM', '11:15 AM', '02:00 PM', '03:30 PM', '04:45 PM']
    },
    {
      employeeId: 'DOC-102',
      name: 'Dr. Julian Vance',
      specialty: 'Neurocritical Care & Stroke Interventional',
      department: 'Neurology Dept',
      qualification: 'MD, PhD, FAAN',
      roleTitle: 'Senior Neurovascular Specialist',
      room: 'Suite 410-B · Neuro Biplane',
      shiftHours: '08:00 - 18:00',
      status: 'In Consultation',
      consultationFee: 240,
      patientsToday: 11,
      maxCapacity: 15,
      verified: true,
      licenseNo: 'NPI-8831044',
      availableSlots: ['10:00 AM', '11:30 AM', '01:30 PM', '03:00 PM', '04:15 PM']
    },
    {
      employeeId: 'DOC-103',
      name: 'Dr. Marcus Thorne',
      specialty: 'Orthopedic Trauma & Robotic Arthroplasty',
      department: 'Orthopedics & Trauma',
      qualification: 'MD, FAAOS',
      roleTitle: 'Director of Robotic Joint Surgery',
      room: 'OR-04 / Ortho Clinic 202',
      shiftHours: '07:30 - 17:30',
      status: 'In Surgery',
      consultationFee: 210,
      patientsToday: 9,
      maxCapacity: 12,
      verified: true,
      licenseNo: 'NPI-7721902',
      availableSlots: ['11:00 AM', '02:30 PM', '04:00 PM']
    },
    {
      employeeId: 'DOC-104',
      name: 'Dr. Elena Vance-Kerr',
      specialty: 'Pulmonology, Critical Care & ECMO',
      department: 'Pulmonology & ICU',
      qualification: 'MD, FCCP',
      roleTitle: 'ICU Medical Director',
      room: 'ICU Command Bay 1',
      shiftHours: '08:00 - 20:00',
      status: 'On Duty',
      consultationFee: 230,
      patientsToday: 12,
      maxCapacity: 16,
      verified: true,
      licenseNo: 'NPI-6650192',
      availableSlots: ['09:00 AM', '10:45 AM', '01:00 PM', '03:15 PM']
    },
    {
      employeeId: 'DOC-105',
      name: 'Dr. Priya Nair',
      specialty: 'Maternal-Fetal Medicine & NICU',
      department: 'Maternal-Fetal & NICU',
      qualification: 'MD, FACOG',
      roleTitle: 'Perinatal Surgical Lead',
      room: 'Perinatal Center 501',
      shiftHours: '08:00 - 18:00',
      status: 'On Duty',
      consultationFee: 200,
      patientsToday: 13,
      maxCapacity: 16,
      verified: true,
      licenseNo: 'NPI-5549011',
      availableSlots: ['09:15 AM', '10:15 AM', '11:45 AM', '02:15 PM', '04:00 PM']
    },
    {
      employeeId: 'DOC-106',
      name: 'Dr. Hiroshi Tanaka',
      specialty: 'Radiation Oncology & Theranostics',
      department: 'Oncology & Infusion',
      qualification: 'MD, FASTRO',
      roleTitle: 'Lead Oncology Attending',
      room: 'Linac Vault B-12',
      shiftHours: '08:30 - 17:30',
      status: 'On Duty',
      consultationFee: 250,
      patientsToday: 10,
      maxCapacity: 14,
      verified: true,
      licenseNo: 'NPI-4438910',
      availableSlots: ['10:30 AM', '01:45 PM', '03:45 PM']
    },
    {
      employeeId: 'DOC-107',
      name: 'Dr. Samuel Osei',
      specialty: 'Nephrology, CRRT & Renal Transplant',
      department: 'Nephrology & Dialysis',
      qualification: 'MD, FASN',
      roleTitle: 'Chief of Renal Medicine',
      room: 'Dialysis Pavilion 204',
      shiftHours: '07:00 - 17:00',
      status: 'On Duty',
      consultationFee: 215,
      patientsToday: 12,
      maxCapacity: 15,
      verified: true,
      licenseNo: 'NPI-3329104',
      availableSlots: ['09:00 AM', '11:00 AM', '02:00 PM']
    },
    {
      employeeId: 'DOC-108',
      name: 'Dr. Rebecca Lin',
      specialty: 'Acute Care, Trauma & Minimally Invasive Surgery',
      department: 'Surgical & OR Suite',
      qualification: 'MD, FACS',
      roleTitle: 'Trauma Surgical Director',
      room: 'Hybrid OR-02',
      shiftHours: '06:30 - 18:30',
      status: 'In Surgery',
      consultationFee: 260,
      patientsToday: 8,
      maxCapacity: 10,
      verified: true,
      licenseNo: 'NPI-2210984',
      availableSlots: ['01:00 PM', '03:30 PM']
    },
    {
      employeeId: 'DOC-109',
      name: 'Dr. Claire Sterling-Vance',
      specialty: 'Diagnostic Radiology, PET-CT & Neuroradiology',
      department: 'Radiology & PACS',
      qualification: 'MD, FACR',
      roleTitle: 'Director of Diagnostic Imaging',
      room: 'PACS Reading Vault 01',
      shiftHours: '08:00 - 18:00',
      status: 'On Duty',
      consultationFee: 195,
      patientsToday: 19,
      maxCapacity: 24,
      verified: true,
      licenseNo: 'NPI-1190823',
      availableSlots: ['09:30 AM', '11:30 AM', '02:30 PM']
    },
    {
      employeeId: 'DOC-110',
      name: 'Dr. Alistair Finch',
      specialty: 'Anesthesiology & Perioperative PACU Critical Care',
      department: 'Surgical & OR Suite',
      qualification: 'MD, FASA',
      roleTitle: 'Chief of Anesthesiology',
      room: 'PACU Command Desk',
      shiftHours: '06:30 - 17:00',
      status: 'On Call',
      consultationFee: 205,
      patientsToday: 11,
      maxCapacity: 15,
      verified: true,
      licenseNo: 'NPI-1092837',
      availableSlots: ['10:00 AM', '02:00 PM']
    }
  ]);

  // 3. SEED 12 APPOINTMENTS IN THE QUEUE
  await Appointment.insertMany([
    {
      tokenNumber: 'TKN-041',
      patientName: 'Marcus Vance',
      mrn: 'MC-8821',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      date: '2026-10-09',
      timeSlot: '09:30 AM',
      visitType: 'Emergency Triage',
      priority: 'STAT',
      status: 'In-Consultation',
      room: 'Suite 304-A',
      waitMinutes: 2,
      reason: 'Acute sub-sternal chest pain & ST-depression review'
    },
    {
      tokenNumber: 'TKN-042',
      patientName: 'Elena Rostova',
      mrn: 'MC-8819',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      date: '2026-10-09',
      timeSlot: '10:00 AM',
      visitType: 'New Consultation',
      priority: 'Urgent',
      status: 'Checked-In',
      room: 'Suite 410-B',
      waitMinutes: 9,
      reason: 'Visual aura migraine & outpatient video-EEG mapping'
    },
    {
      tokenNumber: 'TKN-043',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8804',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      date: '2026-10-09',
      timeSlot: '10:30 AM',
      visitType: 'Follow-up',
      priority: 'Urgent',
      status: 'Waiting',
      room: 'ICU-102B',
      waitMinutes: 14,
      reason: 'AFib RVR rate control & anticoagulation titration'
    },
    {
      tokenNumber: 'TKN-044',
      patientName: 'Chloe Takahashi',
      mrn: 'MC-8825',
      doctorName: 'Dr. Marcus Thorne',
      department: 'Orthopedics & Trauma',
      date: '2026-10-09',
      timeSlot: '11:00 AM',
      visitType: 'Pre-Op Check',
      priority: 'Routine',
      status: 'Completed',
      room: 'Ortho Clinic 202',
      waitMinutes: 0,
      reason: 'Post-Op Day 2 Robotic ACL graft kinematics check'
    },
    {
      tokenNumber: 'TKN-045',
      patientName: 'David K. Sterling',
      mrn: 'MC-8830',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pulmonology & ICU',
      date: '2026-10-09',
      timeSlot: '11:30 AM',
      visitType: 'New Consultation',
      priority: 'Urgent',
      status: 'Checked-In',
      room: 'Pulm Suite 108',
      waitMinutes: 11,
      reason: 'RLL Pneumonia & bronchoscopy airway clearance'
    },
    {
      tokenNumber: 'TKN-046',
      patientName: 'Sophia Al-Mansoor',
      mrn: 'MC-8834',
      doctorName: 'Dr. Priya Nair',
      department: 'Maternal-Fetal & NICU',
      date: '2026-10-09',
      timeSlot: '12:15 PM',
      visitType: 'Telehealth',
      priority: 'Routine',
      status: 'Waiting',
      room: 'Perinatal 501',
      waitMinutes: 6,
      reason: 'High-risk twin gestation NST & umbilical artery Doppler'
    },
    {
      tokenNumber: 'TKN-047',
      patientName: 'Viktor Krumlov',
      mrn: 'MC-8839',
      doctorName: 'Dr. Hiroshi Tanaka',
      department: 'Oncology & Infusion',
      date: '2026-10-09',
      timeSlot: '01:00 PM',
      visitType: 'Follow-up',
      priority: 'Urgent',
      status: 'In-Consultation',
      room: 'Infusion Bay 06',
      waitMinutes: 0,
      reason: 'Cycle 3 Pembrolizumab + Carboplatin infusion clearance'
    },
    {
      tokenNumber: 'TKN-048',
      patientName: 'Hannah Lindqvist',
      mrn: 'MC-8842',
      doctorName: 'Dr. Samuel Osei',
      department: 'Nephrology & Dialysis',
      date: '2026-10-09',
      timeSlot: '01:30 PM',
      visitType: 'Follow-up',
      priority: 'Routine',
      status: 'Completed',
      room: 'HD-BAY-04',
      waitMinutes: 0,
      reason: 'High-flux hemodialysis session & AV fistula Doppler check'
    },
    {
      tokenNumber: 'TKN-049',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      doctorName: 'Dr. Rebecca Lin',
      department: 'Surgical & OR Suite',
      date: '2026-10-09',
      timeSlot: '02:00 PM',
      visitType: 'Pre-Op Check',
      priority: 'STAT',
      status: 'Completed',
      room: 'OR-02',
      waitMinutes: 0,
      reason: 'Emergent Laparoscopic Appendectomy surgical sign-in'
    },
    {
      tokenNumber: 'TKN-050',
      patientName: 'Evelyn Hawthorne',
      mrn: 'MC-8851',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      date: '2026-10-09',
      timeSlot: '02:30 PM',
      visitType: 'Emergency Triage',
      priority: 'STAT',
      status: 'In-Consultation',
      room: 'Neuro Biplane 01',
      waitMinutes: 1,
      reason: 'Post-thrombectomy NIHSS neurovascular check'
    },
    {
      tokenNumber: 'TKN-051',
      patientName: 'Noah Patel-enz',
      mrn: 'MC-8855',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pulmonology & ICU',
      date: '2026-10-09',
      timeSlot: '03:00 PM',
      visitType: 'Emergency Triage',
      priority: 'STAT',
      status: 'Checked-In',
      room: 'PICU-04A',
      waitMinutes: 3,
      reason: 'Pediatric status asthmaticus HFNC titration'
    },
    {
      tokenNumber: 'TKN-052',
      patientName: 'Gabriella Morales',
      mrn: 'MC-8860',
      doctorName: 'Dr. Marcus Thorne',
      department: 'Orthopedics & Trauma',
      date: '2026-10-09',
      timeSlot: '03:30 PM',
      visitType: 'Follow-up',
      priority: 'Routine',
      status: 'Waiting',
      room: 'HBOT Chamber 2',
      waitMinutes: 12,
      reason: 'Hyperbaric Oxygen Therapy Dive #8 & NPWT wound check'
    }
  ]);

  // 4. SEED 12 PHARMACY INVENTORY BATCHES
  await InventoryBatch.insertMany([
    {
      batchId: 'BAT-77312',
      medicineName: 'Atorvastatin Calcium 20mg',
      formulation: 'Film-Coated Tablet · Oral',
      category: 'CARDIO',
      ndc: '0071-0156-23',
      manufacturer: 'Pfizer Clinical Labs',
      quantity: 420,
      minLevel: 100,
      unitPrice: 0.42,
      expiryDate: '2027-11-14',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-65022',
      medicineName: 'Amoxicillin Clavulanate 875mg',
      formulation: 'Extended Release · Oral',
      category: 'ANTI',
      ndc: '0781-1852-31',
      manufacturer: 'Sandoz Biopharma',
      quantity: 18,
      minLevel: 60,
      unitPrice: 9.15,
      expiryDate: '2027-01-08',
      status: 'Low Stock'
    },
    {
      batchId: 'BAT-99014',
      medicineName: 'Tramadol HCl 50mg',
      formulation: 'Immediate Release · Schedule IV',
      category: 'ANALG',
      ndc: '57664-377-18',
      manufacturer: 'Teva Pharmaceuticals',
      quantity: 240,
      minLevel: 80,
      unitPrice: 0.31,
      expiryDate: '2026-10-28',
      status: 'Near Expiry'
    },
    {
      batchId: 'BAT-88123',
      medicineName: 'Albuterol Sulfate HFA 90mcg',
      formulation: 'Metered Dose Inhaler · 200P',
      category: 'RESP',
      ndc: '0093-3165-20',
      manufacturer: 'GSK Respiratory',
      quantity: 165,
      minLevel: 50,
      unitPrice: 24.50,
      expiryDate: '2027-08-30',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-54109',
      medicineName: 'Apixaban (Eliquis) 5mg',
      formulation: 'Factor Xa Inhibitor · Oral',
      category: 'CARDIO',
      ndc: '0003-0894-21',
      manufacturer: 'Bristol-Myers Squibb',
      quantity: 310,
      minLevel: 100,
      unitPrice: 8.40,
      expiryDate: '2027-06-19',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-31098',
      medicineName: 'Sumatriptan Succinate 50mg',
      formulation: '5-HT1 Receptor Agonist · Oral',
      category: 'NEURO',
      ndc: '0173-0735-00',
      manufacturer: 'Dr. Reddy Neuro',
      quantity: 28,
      minLevel: 50,
      unitPrice: 4.80,
      expiryDate: '2027-04-12',
      status: 'Low Stock'
    },
    {
      batchId: 'BAT-44201',
      medicineName: 'Piperacillin-Tazobactam 3.375g',
      formulation: 'Lyophilized Powder · IV Infusion',
      category: 'ANTI',
      ndc: '0206-8862-02',
      manufacturer: 'Wyeth / Pfizer Hospital',
      quantity: 140,
      minLevel: 60,
      unitPrice: 18.90,
      expiryDate: '2027-09-15',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-55812',
      medicineName: 'Diltiazem HCl 25mg/5mL Vial',
      formulation: 'Sterile Cardiac IV Bolus/Drip',
      category: 'CARDIO',
      ndc: '0641-6015-10',
      manufacturer: 'Hikma Injectable',
      quantity: 92,
      minLevel: 40,
      unitPrice: 14.20,
      expiryDate: '2027-05-20',
      status: 'Optimal'
    },
    {
      batchId: 'BAT-61904',
      medicineName: 'Pembrolizumab (Keytruda) 100mg/4mL',
      formulation: 'PD-1 Monoclonal Antibody · IV',
      category: 'ONCO',
      ndc: '0006-3026-02',
      manufacturer: 'Merck Sharp & Dohme',
      quantity: 14,
      minLevel: 20,
      unitPrice: 1420.00,
      expiryDate: '2027-03-11',
      status: 'Low Stock'
    },
    {
      batchId: 'BAT-72910',
      medicineName: 'Tenecteplase (TNKase) 50mg Kit',
      formulation: 'Thrombolytic Tissue Plasminogen · IV STAT',
      category: 'NEURO',
      ndc: '50242-0120-47',
      manufacturer: 'Genentech Neurovascular',
      quantity: 12,
      minLevel: 8,
      unitPrice: 2150.00,
      expiryDate: '2026-10-25',
      status: 'Near Expiry'
    }
  ]);

  // 5. SEED 8 PRESCRIPTIONS
  await Prescription.insertMany([
    {
      rxId: 'RX-9041',
      patientName: 'Marcus Vance',
      mrn: 'MC-8821',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      diagnosis: 'Unstable Angina Pectoris',
      icd10: 'I20.0',
      priority: 'STAT',
      medications: [
        {
          name: 'Atorvastatin Calcium 20mg',
          dosage: '40mg (2 Tabs)',
          frequency: 'Once Daily (HS)',
          duration: '30 Days',
          quantity: 28,
          batchId: 'BAT-77312'
        }
      ],
      status: 'Pending'
    },
    {
      rxId: 'RX-9042',
      patientName: 'David K. Sterling',
      mrn: 'MC-8830',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pulmonology & ICU',
      diagnosis: 'Acute Bacterial Pneumonia',
      icd10: 'J18.9',
      priority: 'Urgent',
      medications: [
        {
          name: 'Amoxicillin Clavulanate 875mg',
          dosage: '875mg',
          frequency: 'Every 12 Hours (BID)',
          duration: '7 Days',
          quantity: 14,
          batchId: 'BAT-65022'
        }
      ],
      status: 'Pending'
    },
    {
      rxId: 'RX-9043',
      patientName: 'Elena Rostova',
      mrn: 'MC-8819',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      diagnosis: 'Migraine with Visual Aura',
      icd10: 'G43.119',
      priority: 'Routine',
      medications: [
        {
          name: 'Sumatriptan Succinate 50mg',
          dosage: '50mg',
          frequency: 'At Migraine Onset (PRN)',
          duration: '15 Days',
          quantity: 9,
          batchId: 'BAT-31098'
        }
      ],
      status: 'Pending'
    },
    {
      rxId: 'RX-9044',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      doctorName: 'Dr. Rebecca Lin',
      department: 'Surgical & OR Suite',
      diagnosis: 'Acute Appendicitis Pre-Op Prophylaxis',
      icd10: 'K35.30',
      priority: 'STAT',
      medications: [
        {
          name: 'Piperacillin-Tazobactam 3.375g',
          dosage: '3.375g IV',
          frequency: 'Every 8 Hours (Q8H)',
          duration: '3 Days',
          quantity: 9,
          batchId: 'BAT-44201'
        }
      ],
      status: 'Pending'
    },
    {
      rxId: 'RX-9045',
      patientName: 'Noah Patel-enz',
      mrn: 'MC-8855',
      doctorName: 'Dr. Elena Vance-Kerr',
      department: 'Pediatric ICU (PICU)',
      diagnosis: 'Status Asthmaticus Bronchospasm',
      icd10: 'J45.52',
      priority: 'STAT',
      medications: [
        {
          name: 'Albuterol Sulfate HFA 90mcg',
          dosage: '4 Puffs via Spacer',
          frequency: 'Every 4 Hours (Q4H)',
          duration: '14 Days',
          quantity: 2,
          batchId: 'BAT-88123'
        }
      ],
      status: 'Pending'
    },
    {
      rxId: 'RX-9039',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8804',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      diagnosis: 'Paroxysmal Atrial Fibrillation',
      icd10: 'I48.0',
      priority: 'STAT',
      medications: [
        {
          name: 'Apixaban (Eliquis) 5mg',
          dosage: '5mg',
          frequency: 'Twice Daily (BID)',
          duration: '30 Days',
          quantity: 60,
          batchId: 'BAT-54109'
        }
      ],
      status: 'Dispensed',
      dispensedAt: new Date(Date.now() - 3600000),
      dispensedBy: 'PharmD. R. Vance'
    },
    {
      rxId: 'RX-9038',
      patientName: 'Viktor Krumlov',
      mrn: 'MC-8839',
      doctorName: 'Dr. Hiroshi Tanaka',
      department: 'Oncology & Infusion',
      diagnosis: 'Stage IIA Lung Adenocarcinoma',
      icd10: 'C34.11',
      priority: 'Urgent',
      medications: [
        {
          name: 'Pembrolizumab (Keytruda) 100mg/4mL',
          dosage: '200mg IV Infusion',
          frequency: 'Every 21 Days (Cycle 3)',
          duration: '1 Dose',
          quantity: 2,
          batchId: 'BAT-61904'
        }
      ],
      status: 'Dispensed',
      dispensedAt: new Date(Date.now() - 7200000),
      dispensedBy: 'PharmD. R. Vance'
    }
  ]);

  // 6. SEED 12 INPATIENT & ICU BEDS
  await Bed.insertMany([
    {
      bedNumber: 'ICU-101A',
      wardName: 'Cardiothoracic & Medical ICU',
      floor: 'Floor 4 · Critical Care Tower',
      bedType: 'ICU Telemetry',
      status: 'Available',
      acuity: 'None'
    },
    {
      bedNumber: 'ICU-102B',
      wardName: 'Cardiothoracic & Medical ICU',
      floor: 'Floor 4 · Critical Care Tower',
      bedType: 'ICU Telemetry',
      status: 'Occupied',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8804',
      attendingDoctor: 'Dr. Sarah Jenkins',
      acuity: 'Rose',
      admittedAt: '2026-10-08 21:15',
      diagnosis: 'AFib with Rapid Ventricular Response (I48.0)',
      ventilatorActive: false
    },
    {
      bedNumber: 'NICU-201A',
      wardName: 'Neurocritical & Stroke ICU',
      floor: 'Floor 4 · Neuro Tower',
      bedType: 'ICU Telemetry',
      status: 'Occupied',
      patientName: 'Evelyn Hawthorne',
      mrn: 'MC-8851',
      attendingDoctor: 'Dr. Julian Vance',
      acuity: 'Rose',
      admittedAt: '2026-10-09 06:50',
      diagnosis: 'Post-Thrombectomy Right MCA Stroke (I63.511)',
      ventilatorActive: false
    },
    {
      bedNumber: 'PICU-04A',
      wardName: 'Pediatric Critical Care (PICU)',
      floor: 'Floor 5 · Children Pavilion',
      bedType: 'ICU Telemetry',
      status: 'Occupied',
      patientName: 'Noah Patel-enz',
      mrn: 'MC-8855',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      acuity: 'Rose',
      admittedAt: '2026-10-09 09:20',
      diagnosis: 'Severe Status Asthmaticus on HFNC (J45.52)',
      ventilatorActive: true
    },
    {
      bedNumber: 'CCU-304A',
      wardName: 'Cardiology Step-Down Wing',
      floor: 'Floor 3 · North Wing',
      bedType: 'Cardiac Step-Down',
      status: 'Occupied',
      patientName: 'Marcus Vance',
      mrn: 'MC-8821',
      attendingDoctor: 'Dr. Sarah Jenkins',
      acuity: 'Rose',
      admittedAt: '2026-10-09 09:45',
      diagnosis: 'Unstable Angina / Rule-out NSTEMI (I20.0)',
      ventilatorActive: false
    },
    {
      bedNumber: 'CCU-305B',
      wardName: 'Cardiology Step-Down Wing',
      floor: 'Floor 3 · North Wing',
      bedType: 'Cardiac Step-Down',
      status: 'Cleaning',
      acuity: 'None'
    },
    {
      bedNumber: 'WARD-208A',
      wardName: 'Orthopedic & Surgical Recovery',
      floor: 'Floor 2 · East Wing',
      bedType: 'Surgical Recovery',
      status: 'Occupied',
      patientName: 'Chloe Takahashi',
      mrn: 'MC-8825',
      attendingDoctor: 'Dr. Marcus Thorne',
      acuity: 'Emerald',
      admittedAt: '2026-10-07 14:20',
      diagnosis: 'Post-Op Robotic ACL Arthroplasty (Z47.89)',
      ventilatorActive: false
    },
    {
      bedNumber: 'WARD-209B',
      wardName: 'Orthopedic & Surgical Recovery',
      floor: 'Floor 2 · East Wing',
      bedType: 'Surgical Recovery',
      status: 'Available',
      acuity: 'None'
    },
    {
      bedNumber: 'PACU-03',
      wardName: 'Perioperative PACU Recovery',
      floor: 'Floor 2 · Surgical Core',
      bedType: 'Surgical Recovery',
      status: 'Occupied',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      attendingDoctor: 'Dr. Rebecca Lin',
      acuity: 'Amber',
      admittedAt: '2026-10-09 08:15',
      diagnosis: 'Laparoscopic Appendectomy Recovery (K35.30)',
      ventilatorActive: false
    },
    {
      bedNumber: 'WARD-410C',
      wardName: 'Pulmonary & Isolation Suite',
      floor: 'Floor 4 · West Wing',
      bedType: 'Isolation Negative-Pressure',
      status: 'Occupied',
      patientName: 'David K. Sterling',
      mrn: 'MC-8830',
      attendingDoctor: 'Dr. Elena Vance-Kerr',
      acuity: 'Amber',
      admittedAt: '2026-10-09 06:10',
      diagnosis: 'Acute RLL Pneumonia & COPD Exacerbation (J18.9)',
      ventilatorActive: true
    },
    {
      bedNumber: 'LD-502A',
      wardName: 'Maternal-Fetal & High-Risk Perinatal',
      floor: 'Floor 5 · Perinatal Pavilion',
      bedType: 'General Inpatient',
      status: 'Occupied',
      patientName: 'Sophia Al-Mansoor',
      mrn: 'MC-8834',
      attendingDoctor: 'Dr. Priya Nair',
      acuity: 'Amber',
      admittedAt: '2026-10-08 11:00',
      diagnosis: '34W Twin Gestation Telemetry (O30.043)',
      ventilatorActive: false
    },
    {
      bedNumber: 'ONC-601A',
      wardName: 'Oncology & Cellular Therapy Ward',
      floor: 'Floor 6 · Cancer Center',
      bedType: 'General Inpatient',
      status: 'Occupied',
      patientName: 'Viktor Krumlov',
      mrn: 'MC-8839',
      attendingDoctor: 'Dr. Hiroshi Tanaka',
      acuity: 'Amber',
      admittedAt: '2026-10-09 08:45',
      diagnosis: 'Cycle 3 Chemo-Immunotherapy Infusion (C34.11)',
      ventilatorActive: false
    }
  ]);

  // 7. SEED 9 LAB & RADIOLOGY ORDERS
  await LabOrder.insertMany([
    {
      orderId: 'LAB-4091',
      patientName: 'Marcus Vance',
      mrn: 'MC-8821',
      testName: 'High-Sensitivity Troponin-T (hs-cTnT)',
      category: 'Cardiac Biomarkers',
      priority: 'STAT',
      orderedBy: 'Dr. Sarah Jenkins',
      status: 'Critical Alert',
      resultValue: '0.18 ng/mL',
      referenceRange: '< 0.04 ng/mL',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-4092',
      patientName: 'Arthur Pendelton',
      mrn: 'MC-8804',
      testName: 'NT-proBNP & Comprehensive Metabolic Panel',
      category: 'Cardiac Biomarkers',
      priority: 'STAT',
      orderedBy: 'Dr. Sarah Jenkins',
      status: 'Completed',
      resultValue: '640 pg/mL',
      referenceRange: '< 125 pg/mL',
      flag: 'High'
    },
    {
      orderId: 'LAB-4093',
      patientName: 'Elena Rostova',
      mrn: 'MC-8819',
      testName: '3T Brain MRI Angiography (MRA Circle of Willis)',
      category: 'Radiology PACS',
      priority: 'Urgent',
      orderedBy: 'Dr. Julian Vance',
      status: 'In Analyzer',
      resultValue: 'DICOM Reconstruction 82%',
      referenceRange: 'Unremarkable Vascular Flow',
      flag: 'Pending'
    },
    {
      orderId: 'LAB-4094',
      patientName: 'David K. Sterling',
      mrn: 'MC-8830',
      testName: 'Sputum Culture, Gram Stain & Arterial Blood Gas',
      category: 'Microbiology',
      priority: 'Urgent',
      orderedBy: 'Dr. Elena Vance-Kerr',
      status: 'Completed',
      resultValue: 'pH 7.36, PaO2 68 mmHg, Strep. pneumoniae +',
      referenceRange: 'pH 7.35-7.45',
      flag: 'High'
    },
    {
      orderId: 'LAB-4095',
      patientName: 'Chloe Takahashi',
      mrn: 'MC-8825',
      testName: 'CBC with Differential & CRP Post-Op Panel',
      category: 'Hematology',
      priority: 'Routine',
      orderedBy: 'Dr. Marcus Thorne',
      status: 'Completed',
      resultValue: 'WBC 6.8 x10³/µL, Hgb 13.4 g/dL',
      referenceRange: 'WBC 4.5-11.0',
      flag: 'Normal'
    },
    {
      orderId: 'LAB-4096',
      patientName: 'Evelyn Hawthorne',
      mrn: 'MC-8851',
      testName: 'CT Perfusion & Cerebral Angiography (Biplane)',
      category: 'Radiology PACS',
      priority: 'STAT',
      orderedBy: 'Dr. Julian Vance',
      status: 'Critical Alert',
      resultValue: 'Right M1 MCA Occlusion · TICI 3 Post-Retrieval',
      referenceRange: 'Patent Intracranial Vessels',
      flag: 'Critical'
    },
    {
      orderId: 'LAB-4097',
      patientName: 'Hannah Lindqvist',
      mrn: 'MC-8842',
      testName: 'Renal Dialysis Electrolyte & Kt/V Clearance Panel',
      category: 'Biochemistry',
      priority: 'Urgent',
      orderedBy: 'Dr. Samuel Osei',
      status: 'Completed',
      resultValue: 'K+ 5.3 mEq/L, BUN 58 mg/dL, Kt/V 1.42',
      referenceRange: 'K+ 3.5-5.0 mEq/L',
      flag: 'High'
    },
    {
      orderId: 'LAB-4098',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      testName: 'Surgical Histopathology: Appendix Specimen Biopsy',
      category: 'Pathology Biopsy',
      priority: 'Routine',
      orderedBy: 'Dr. Rebecca Lin',
      status: 'Completed',
      resultValue: 'Acute Suppurative Appendicitis, Negative for Malignancy',
      referenceRange: 'Benign',
      flag: 'Normal'
    }
  ]);

  // 8. SEED 6 HOSPITAL INVOICES
  await Invoice.insertMany([
    {
      invoiceId: 'INV-2026-881',
      patientName: 'Marcus Vance',
      mrn: 'MC-8821',
      department: 'Cardiology Wing',
      attendingDoctor: 'Dr. Sarah Jenkins',
      items: [
        { description: 'Level 5 Emergency Cardiac Consultation', category: 'Consultation', code: 'CPT-99285', amount: 450 },
        { description: '12-Lead Digital ECG & Telemetry Hookup', category: 'Diagnostics', code: 'CPT-93000', amount: 185 },
        { description: 'STAT High-Sensitivity Troponin-T Assay', category: 'Laboratory', code: 'CPT-84484', amount: 120 },
        { description: 'CCU Step-Down Bed Admission (Day 1)', category: 'Inpatient Ward', code: 'REV-0200', amount: 1250 }
      ],
      subtotal: 2005,
      taxAmount: 0,
      insuranceCovered: 1604,
      patientPayable: 401,
      paymentMethod: 'BlueCross Shield EDI',
      status: 'Insurance Claim',
      issuedDate: '2026-10-09'
    },
    {
      invoiceId: 'INV-2026-882',
      patientName: 'Chloe Takahashi',
      mrn: 'MC-8825',
      department: 'Orthopedics & Trauma',
      attendingDoctor: 'Dr. Marcus Thorne',
      items: [
        { description: 'Robotic-Assisted ACL Reconstruction Surgery', category: 'Surgical OR', code: 'CPT-29888', amount: 4800 },
        { description: 'Surgical Recovery Ward Bed (2 Days)', category: 'Inpatient Ward', code: 'REV-0120', amount: 1400 },
        { description: 'Inpatient Physical Therapy Kinematic Eval', category: 'Rehabilitation', code: 'CPT-97161', amount: 240 }
      ],
      subtotal: 6440,
      taxAmount: 0,
      insuranceCovered: 5796,
      patientPayable: 644,
      paymentMethod: 'UnitedHealthcare EDI Paid',
      status: 'Paid',
      issuedDate: '2026-10-09'
    },
    {
      invoiceId: 'INV-2026-883',
      patientName: 'Elena Rostova',
      mrn: 'MC-8819',
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      items: [
        { description: 'Neurology Specialist Consultation', category: 'Consultation', code: 'CPT-99204', amount: 240 },
        { description: '3T Brain MRI/MRA Without Contrast', category: 'Radiology', code: 'CPT-70551', amount: 890 }
      ],
      subtotal: 1130,
      taxAmount: 0,
      insuranceCovered: 904,
      patientPayable: 226,
      paymentMethod: 'Aetna Copay Card',
      status: 'Pending',
      issuedDate: '2026-10-09'
    },
    {
      invoiceId: 'INV-2026-884',
      patientName: 'Evelyn Hawthorne',
      mrn: 'MC-8851',
      department: 'Neurology Dept',
      attendingDoctor: 'Dr. Julian Vance',
      items: [
        { description: 'Endovascular Mechanical Thrombectomy (M1 MCA)', category: 'Neuro Biplane OR', code: 'CPT-61645', amount: 8900 },
        { description: 'Tenecteplase 50mg Thrombolytic Bolus', category: 'Pharmacy STAT', code: 'J3101', amount: 2150 },
        { description: 'Neurocritical ICU Telemetry Bed', category: 'ICU', code: 'REV-0206', amount: 2400 }
      ],
      subtotal: 13450,
      taxAmount: 0,
      insuranceCovered: 12105,
      patientPayable: 1345,
      paymentMethod: 'Medicare Part A DRG',
      status: 'Paid',
      issuedDate: '2026-10-09'
    },
    {
      invoiceId: 'INV-2026-885',
      patientName: 'Viktor Krumlov',
      mrn: 'MC-8839',
      department: 'Oncology & Infusion',
      attendingDoctor: 'Dr. Hiroshi Tanaka',
      items: [
        { description: 'Pembrolizumab 200mg IV Chemo-Immunotherapy', category: 'Oncology Infusion', code: 'J9271', amount: 4600 },
        { description: 'Chemotherapy IV Infusion 1st Hour', category: 'Infusion Suite', code: 'CPT-96413', amount: 420 }
      ],
      subtotal: 5020,
      taxAmount: 0,
      insuranceCovered: 4518,
      patientPayable: 502,
      paymentMethod: 'Aetna Oncology EDI',
      status: 'Insurance Claim',
      issuedDate: '2026-10-09'
    },
    {
      invoiceId: 'INV-2026-886',
      patientName: 'Liam O-Connor',
      mrn: 'MC-8847',
      department: 'Surgical & OR Suite',
      attendingDoctor: 'Dr. Rebecca Lin',
      items: [
        { description: 'Laparoscopic Appendectomy & Peritoneal Lavage', category: 'Surgical OR', code: 'CPT-44970', amount: 3950 },
        { description: 'Anesthesia General Endotracheal', category: 'Anesthesiology', code: 'CPT-00840', amount: 850 }
      ],
      subtotal: 4800,
      taxAmount: 0,
      insuranceCovered: 4320,
      patientPayable: 480,
      paymentMethod: 'Kaiser Surgical EDI',
      status: 'Paid',
      issuedDate: '2026-10-09'
    }
  ]);

  // 9. SEED 8 AUDIT LOGS
  await AuditLog.insertMany([
    {
      timeStr: '10:42:18',
      actor: 'Dr. Sarah Jenkins',
      role: 'Lead Attending',
      module: 'Cardiology Consultation',
      actionType: 'LAB_STAT',
      summary: 'CRITICAL BIOMARKER ACK: hs-Troponin-T elevated (0.18 ng/mL) for Marcus Vance (#MC-8821). Cath Lab notified.',
      severity: 'Rose'
    },
    {
      timeStr: '10:35:04',
      actor: 'PharmD. R. Vance',
      role: 'Chief Pharmacist',
      module: 'Pharmacy Dispensing Hub',
      actionType: 'DISPENSED',
      summary: 'Subtracted -60 units Apixaban 5mg (BAT-54109) for Arthur Pendelton (#MC-8804). Verified & Sealed.',
      severity: 'Emerald'
    },
    {
      timeStr: '10:18:50',
      actor: 'Reception Desk 02',
      role: 'Triage Coordinator',
      module: 'Appointment & Queue Engine',
      actionType: 'BOOKING',
      summary: 'Atomic slot lease locked: Token TKN-042 checked in for Elena Rostova (#MC-8819) with Dr. Julian Vance.',
      severity: 'Primary'
    },
    {
      timeStr: '10:05:11',
      actor: 'Dr. Julian Vance',
      role: 'Neurovascular Lead',
      module: 'Comprehensive Stroke Center',
      actionType: 'CONSULT',
      summary: 'TICI 3 complete recanalization achieved for Evelyn Hawthorne (#MC-8851). Transferred to Bed NICU-201A.',
      severity: 'Emerald'
    },
    {
      timeStr: '09:50:12',
      actor: 'Billing Automator',
      role: 'Revenue Integrity',
      module: 'Hospital Billing & Claims',
      actionType: 'BILLING',
      summary: 'EDI 837I Claim #INV-2026-882 settled ($6,440.00) with UnitedHealthcare for Chloe Takahashi.',
      severity: 'Emerald'
    },
    {
      timeStr: '09:32:40',
      actor: 'Dr. Rebecca Lin',
      role: 'Trauma Surgeon',
      module: 'Operating Room Suite',
      actionType: 'ADMISSION',
      summary: 'Completed Laparoscopic Appendectomy for Liam O-Connor (#MC-8847). Transferred to PACU-03.',
      severity: 'Primary'
    }
  ]);

  // 10. SEED 5 ROLE DEMO USERS (PURE JS HASHED PASSWORDS)
  await User.insertMany([
    {
      name: 'System Administrator',
      email: 'admin@medicare.test',
      passwordHash: hashPassword('Admin123!'),
      role: 'admin',
      phone: '+1 (555) 100-0001',
      accountStatus: 'active'
    },
    {
      name: 'Dr. Sarah Jenkins',
      email: 'doctor@medicare.test',
      passwordHash: hashPassword('Doctor123!'),
      role: 'doctor',
      phone: '+1 (555) 200-0002',
      accountStatus: 'active'
    },
    {
      name: 'Marcus Vance',
      email: 'patient@medicare.test',
      passwordHash: hashPassword('Patient123!'),
      role: 'patient',
      phone: '+1 (555) 234-8821',
      accountStatus: 'active'
    },
    {
      name: 'Triage Receptionist',
      email: 'receptionist@medicare.test',
      passwordHash: hashPassword('Reception123!'),
      role: 'receptionist',
      phone: '+1 (555) 400-0004',
      accountStatus: 'active'
    },
    {
      name: 'PharmD. R. Vance',
      email: 'pharmacist@medicare.test',
      passwordHash: hashPassword('Pharmacy123!'),
      role: 'pharmacist',
      phone: '+1 (555) 500-0005',
      accountStatus: 'active'
    }
  ]);

  // 11. SEED 8 CLINICAL DEPARTMENTS
  await Department.insertMany([
    {
      name: 'Cardiology Wing',
      code: 'CARDIO',
      description: 'Comprehensive interventional and outpatient cardiovascular care.',
      headDoctorName: 'Dr. Sarah Jenkins',
      isActive: true,
      staffCount: 24,
      roomCount: 16
    },
    {
      name: 'Neurology Dept',
      code: 'NEURO',
      description: 'Acute neurovascular stroke, neurocritical care, and telemetry.',
      headDoctorName: 'Dr. Julian Vance',
      isActive: true,
      staffCount: 18,
      roomCount: 12
    },
    {
      name: 'Orthopedics & Trauma',
      code: 'ORTHO',
      description: 'Robotic joint arthroplasty, fracture management, and sports trauma.',
      headDoctorName: 'Dr. Marcus Thorne',
      isActive: true,
      staffCount: 16,
      roomCount: 10
    },
    {
      name: 'Pulmonology & ICU',
      code: 'PULMO',
      description: 'Critical care ventilation, bronchoscopy, and ECMO management.',
      headDoctorName: 'Dr. Elena Vance-Kerr',
      isActive: true,
      staffCount: 20,
      roomCount: 14
    },
    {
      name: 'Maternal-Fetal & NICU',
      code: 'MATERNAL',
      description: 'High-risk perinatology, fetal echocardiography, and level IV NICU.',
      headDoctorName: 'Dr. Priya Nair',
      isActive: true,
      staffCount: 22,
      roomCount: 15
    },
    {
      name: 'Oncology & Infusion',
      code: 'ONCO',
      description: 'Targeted immunotherapy, biological infusions, and radiation oncology.',
      headDoctorName: 'Dr. Hiroshi Tanaka',
      isActive: true,
      staffCount: 14,
      roomCount: 10
    },
    {
      name: 'Nephrology & Dialysis',
      code: 'NEPHRO',
      description: 'High-flux hemodialysis, CRRT continuous renal therapy, and transplant.',
      headDoctorName: 'Dr. Samuel Osei',
      isActive: true,
      staffCount: 12,
      roomCount: 8
    },
    {
      name: 'Surgical & OR Suite',
      code: 'SURG',
      description: 'Hybrid emergency OR suites, minimally invasive laparoscopy, and PACU.',
      headDoctorName: 'Dr. Rebecca Lin',
      isActive: true,
      staffCount: 28,
      roomCount: 8
    }
  ]);

  // 12. SEED DOCTOR AVAILABILITY SCHEDULES
  await DoctorAvailability.insertMany([
    {
      doctorId: 'DOC-101',
      doctorName: 'Dr. Sarah Jenkins',
      department: 'Cardiology Wing',
      workingDays: [1, 2, 3, 4, 5],
      startTime: '08:30',
      endTime: '17:30',
      slotDuration: 30,
      breakPeriods: [{ title: 'Lunch Break', start: '12:30', end: '13:30' }],
      vacationDates: [],
      isActive: true
    },
    {
      doctorId: 'DOC-102',
      doctorName: 'Dr. Julian Vance',
      department: 'Neurology Dept',
      workingDays: [1, 2, 3, 4, 5],
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: 30,
      breakPeriods: [{ title: 'Lunch Break', start: '13:00', end: '14:00' }],
      vacationDates: [],
      isActive: true
    },
    {
      doctorId: 'DOC-103',
      doctorName: 'Dr. Marcus Thorne',
      department: 'Orthopedics & Trauma',
      workingDays: [1, 2, 3, 4, 6],
      startTime: '08:00',
      endTime: '16:00',
      slotDuration: 30,
      breakPeriods: [{ title: 'Lunch Break', start: '12:00', end: '13:00' }],
      vacationDates: [],
      isActive: true
    }
  ]);

  console.log('MediCare Hospital Core OS comprehensive dummy dataset seeded!');
}

module.exports = { seedDatabase };

if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/medicare_hms';
  mongoose
    .connect(MONGO_URI)
    .then(async () => {
      await seedDatabase(true);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
