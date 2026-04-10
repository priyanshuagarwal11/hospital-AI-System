// ============================================================
// utils/seedData.js - Seed MongoDB with realistic demo data
// Run: node src/utils/seedData.js
// ============================================================

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');


const User      = require('../models/User');
const Bed       = require('../models/Bed');
const Equipment = require('../models/Equipment');
const Staff     = require('../models/Staff');
const Patient   = require('../models/Patient');
const Alert     = require('../models/Alert');

const DEPARTMENTS = ['ICU','General','Emergency','Pediatrics','Maternity','Surgery','Cardiology','Orthopedics','Neurology','Oncology'];
const DIAGNOSES   = ['Hypertension','Diabetes Mellitus','Acute Myocardial Infarction','Pneumonia','Appendicitis','Fracture','Stroke','Sepsis','COPD','Kidney Failure','Heart Failure','Asthma','Cancer','COVID-19','Dengue Fever'];
const PATIENT_NAMES = ['Arjun Sharma','Priya Patel','Rahul Singh','Ananya Verma','Vikram Gupta','Sunita Rao','Amit Kumar','Kavita Joshi','Deepak Mehta','Meera Nair','Suresh Iyer','Lakshmi Reddy','Ravi Chandra','Pooja Mishra','Sandeep Yadav','Divya Agarwal','Ajay Tiwari','Neha Srivastava','Manoj Pandey','Shalini Chauhan','David Johnson','Emily Williams','Michael Brown','Sarah Davis','James Wilson','Anna Thompson','Robert Martinez','Jessica Taylor','William Anderson','Mary Jackson'];
const STAFF_NAMES  = ['Dr. Rajiv Khanna','Dr. Sneha Pillai','Dr. Arun Joshi','Dr. Preethi Krishnan','Dr. Sanjay Mehta','Dr. Anita Desai','Nurse Kavya Reddy','Nurse Rahul Das','Nurse Sunita Bose','Nurse Arjun Nair','Nurse Meena Rao','Tech. Suresh Kumar','Tech. Deepa Verma','Tech. Rajan Thomas','Pharm. Leela Sharma','Admin Vijay Patil','Admin Chitra Nambiar','Dr. Eliza Chen','Dr. Marco Rossi','Nurse Sarah O\'Brien'];

// ── Random helpers ─────────────────────────────────────────
const pick   = arr => arr[Math.floor(Math.random() * arr.length)];
const rand   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randF  = (min, max) => +(Math.random() * (max - min) + min).toFixed(2);
const daysAgo = n => new Date(Date.now() - n * 24 * 60 * 60 * 1000);
const uid    = (prefix, n) => `${prefix}-${String(n).padStart(4, '0')}`;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_ai');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([User.deleteMany(), Bed.deleteMany(), Equipment.deleteMany(),
      Staff.deleteMany(), Patient.deleteMany(), Alert.deleteMany()]);
    console.log('🗑️  Cleared existing data');

    // ── 1. Admin User ──────────────────────────────────────
    // Use User.create() so pre-save hook hashes passwords correctly
    await User.create({ name: 'Admin User', email: 'admin@hospital.com', password: 'admin123', role: 'admin', department: 'Administration' });
    await User.create({ name: 'Dr. Chief Medical', email: 'doctor@hospital.com', password: 'admin123', role: 'doctor', department: 'General' });
    console.log('👤 Users created');

    // ── 2. Beds ────────────────────────────────────────────
    const bedTypes  = { ICU: 'icu', General: 'standard', Emergency: 'standard', Pediatrics: 'standard', Maternity: 'semi-private', Surgery: 'private', Cardiology: 'icu', Orthopedics: 'standard', Neurology: 'icu', Oncology: 'private' };
    const bedsPerDept = { ICU: 20, General: 50, Emergency: 30, Pediatrics: 25, Maternity: 20, Surgery: 15, Cardiology: 20, Orthopedics: 20, Neurology: 15, Oncology: 15 };
    const bedDocs = [];
    let bedIdx = 1;

    for (const dept of DEPARTMENTS) {
      const count = bedsPerDept[dept];
      for (let i = 1; i <= count; i++) {
        const r = Math.random();
        const status = r < 0.72 ? 'occupied' : r < 0.88 ? 'available' : r < 0.95 ? 'reserved' : 'maintenance';
        bedDocs.push({
          bedNumber: `${dept.substring(0,3).toUpperCase()}-${String(i).padStart(3,'0')}`,
          department: dept,
          ward: `Ward ${String.fromCharCode(65 + (i % 4))}`,
          floor: Math.ceil(i / 10),
          type: bedTypes[dept] || 'standard',
          status,
          features: Math.random() > 0.5 ? ['oxygen', 'IV-stand'] : ['call-button'],
          lastCleaned: daysAgo(rand(0, 3))
        });
        bedIdx++;
      }
    }
    const savedBeds = await Bed.insertMany(bedDocs);
    console.log(`🛏️  ${savedBeds.length} beds created`);

    // ── 3. Equipment ───────────────────────────────────────
    const equipList = [
      { name: 'Ventilator', category: 'Life Support', qty: 30 },
      { name: 'ECG Monitor', category: 'Monitoring', qty: 50 },
      { name: 'Infusion Pump', category: 'Therapeutic', qty: 80 },
      { name: 'Defibrillator', category: 'Emergency', qty: 20 },
      { name: 'Ultrasound Machine', category: 'Diagnostic', qty: 15 },
      { name: 'X-Ray Machine', category: 'Imaging', qty: 8 },
      { name: 'MRI Scanner', category: 'Imaging', qty: 3 },
      { name: 'CT Scanner', category: 'Imaging', qty: 4 },
      { name: 'Pulse Oximeter', category: 'Monitoring', qty: 100 },
      { name: 'Blood Pressure Monitor', category: 'Monitoring', qty: 60 },
      { name: 'Syringe Pump', category: 'Therapeutic', qty: 70 },
      { name: 'Oxygen Concentrator', category: 'Life Support', qty: 40 },
      { name: 'Surgical Light', category: 'Surgical', qty: 10 },
      { name: 'Operating Table', category: 'Surgical', qty: 8 },
      { name: 'Autoclave', category: 'Laboratory', qty: 6 }
    ];

    const equipDocs = [];
    let eIdx = 1;
    equipList.forEach(eq => {
      DEPARTMENTS.forEach(dept => {
        if (Math.random() > 0.4) {
          const qty   = Math.max(1, Math.floor(eq.qty / DEPARTMENTS.length) + rand(-2, 2));
          const inUse = Math.floor(qty * randF(0.3, 0.95));
          equipDocs.push({
            name: eq.name, equipmentId: uid('EQ', eIdx++),
            category: eq.category, department: dept,
            status: inUse >= qty ? 'in-use' : 'available',
            condition: pick(['excellent','good','good','fair']),
            quantity: qty, inUse,
            manufacturer: pick(['Philips','GE Healthcare','Siemens','Mindray','Drager']),
            purchaseDate: daysAgo(rand(180, 1800)),
            lastMaintenanceDate: daysAgo(rand(0, 90)),
            nextMaintenanceDate: daysAgo(-rand(30, 180))
          });
        }
      });
    });
    await Equipment.insertMany(equipDocs);
    console.log(`⚙️  ${equipDocs.length} equipment records created`);

    // ── 4. Staff ───────────────────────────────────────────
    const roles       = ['Doctor','Nurse','Technician','Pharmacist','Support','Surgeon','Anesthesiologist','Radiologist'];
    const roleByDept  = { ICU: ['Doctor','Nurse','Nurse'], Emergency: ['Doctor','Nurse','Technician'], Surgery: ['Surgeon','Anesthesiologist','Nurse'], Radiology: ['Radiologist','Technician'] };
    const shifts      = ['morning','afternoon','night','on-call'];
    const statuses    = ['on-duty','on-duty','on-duty','off-duty','on-leave'];

    const staffDocs = [];
    let sIdx = 1;
    DEPARTMENTS.forEach(dept => {
      const count = rand(8, 20);
      for (let i = 0; i < count; i++) {
        const roleArr = roleByDept[dept] || roles;
        staffDocs.push({
          staffId: uid('STF', sIdx),
          name: STAFF_NAMES[sIdx % STAFF_NAMES.length] + (sIdx > STAFF_NAMES.length ? ` ${Math.floor(sIdx/STAFF_NAMES.length)}` : ''),
          role: pick(roleArr), department: dept,
          shift: pick(shifts), status: pick(statuses),
          experience: rand(1, 25),
          contact: { phone: `+91-${rand(7000000000, 9999999999)}`, email: `staff${sIdx}@hospital.com` },
          qualifications: [pick(['MBBS','MD','MS','DNB','BScNursing','GNM','DMLT'])],
          joiningDate: daysAgo(rand(30, 3000)),
          salary: rand(30000, 200000),
          isActive: true
        });
        sIdx++;
      }
    });
    const savedStaff = await Staff.insertMany(staffDocs);
    console.log(`👨‍⚕️  ${savedStaff.length} staff created`);

    // ── 5. Patients ────────────────────────────────────────
    const availBeds = savedBeds.filter(b => b.status === 'occupied');
    const availDoctors = savedStaff.filter(s => s.role === 'Doctor' || s.role === 'Surgeon');
    const severities  = ['critical','serious','moderate','moderate','mild','stable'];
    const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

    const patientDocs = [];
    for (let i = 0; i < Math.min(180, availBeds.length); i++) {
      const admDaysAgo = rand(0, 45);
      const isDischarge = Math.random() > 0.8 && admDaysAgo > 5;
      patientDocs.push({
        patientId: uid('PAT', i + 1),
        name: PATIENT_NAMES[i % PATIENT_NAMES.length] + (i >= PATIENT_NAMES.length ? ` ${Math.floor(i/PATIENT_NAMES.length)+2}` : ''),
        age: rand(1, 90),
        gender: pick(['male','female','other']),
        bloodGroup: pick(bloodGroups),
        department: availBeds[i].department,
        bed: availBeds[i]._id,
        attendingDoctor: availDoctors[i % availDoctors.length]?._id,
        diagnosis: pick(DIAGNOSES),
        severity: pick(severities),
        status: isDischarge ? 'discharged' : 'admitted',
        admissionDate: daysAgo(admDaysAgo),
        dischargeDate: isDischarge ? daysAgo(rand(0, admDaysAgo - 1)) : undefined,
        contact: { phone: `+91-${rand(7000000000, 9999999999)}` },
        insuranceProvider: pick(['Star Health','HDFC Ergo','Bajaj Allianz','New India','None'])
      });
    }
    await Patient.insertMany(patientDocs);
    console.log(`🏥 ${patientDocs.length} patients created`);

    // ── 6. Alerts ──────────────────────────────────────────
    const alertSamples = [
      { type:'bed_shortage', severity:'critical', title:'Critical Bed Shortage – ICU', message:'Only 2 beds available in ICU. Immediate reallocation required.', department:'ICU' },
      { type:'equipment_shortage', severity:'high', title:'Ventilator Demand Spike', message:'Ventilator utilization in ICU has crossed 90%. Redistribute immediately.', department:'ICU' },
      { type:'staff_shortage', severity:'high', title:'Night Shift Understaffed – Emergency', message:'Emergency department has only 3 nurses on night shift. Minimum required: 6.', department:'Emergency' },
      { type:'high_patient_inflow', severity:'medium', title:'High Patient Inflow Predicted', message:'AI model predicts 35% increase in admissions over the next 72 hours.', department:'General' },
      { type:'maintenance_due', severity:'low', title:'MRI Scanner Maintenance Due', message:'MRI Scanner in Radiology is overdue for scheduled maintenance by 5 days.', department:'Radiology' },
      { type:'bed_shortage', severity:'high', title:'Maternity Ward Nearing Capacity', message:'Maternity ward is at 92% occupancy. Prepare overflow protocol.', department:'Maternity' },
      { type:'critical_patient', severity:'critical', title:'Multiple Critical Patients – Cardiology', message:'3 critical cardiac patients admitted in the last hour. Additional cardiologist required.', department:'Cardiology' },
      { type:'equipment_shortage', severity:'medium', title:'Pulse Oximeter Shortage – Pediatrics', message:'Only 4 pulse oximeters available in Pediatrics. 8 more needed.', department:'Pediatrics' }
    ];
    await Alert.insertMany(alertSamples.map((a, i) => ({
      ...a,
      isRead: i > 3,
      isResolved: i > 5,
      createdAt: daysAgo(rand(0, 7))
    })));
    console.log(`🚨 ${alertSamples.length} alerts created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Login credentials:');
    console.log('   Admin: admin@hospital.com / admin123');
    console.log('   Doctor: doctor@hospital.com / admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
