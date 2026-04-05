/**
 * Seed script — populates MongoDB with military test data
 * Run: node seedData.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

// Models
const User     = require('./models/User');
const Employee = require('./models/Employee');
const Card     = require('./models/Card');
const AccessLog = require('./models/AccessLog');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/smartgate';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Employee.deleteMany({}),
      Card.deleteMany({}),
      AccessLog.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ── Create Authorized Users ─────────────────────────────
    const usersData = [
      { email: 'admin@gate.local',           password: 'admin123',   role: 'admin'    },
      { email: 'security@gate.local',        password: 'security123', role: 'security'},
      { email: 'tamannasaini860@gmail.com',  password: 'tanusaini',  role: 'user'     },
      { email: 'sonakshidhiman12@gmail.com', password: 'sonakshi12', role: 'user'     },
    ];

    const users = [];
    for (const u of usersData) {
      const user = await User.create({
        email: u.email,
        password: u.password,
        role: u.role
      });
      users.push(user);
      console.log(`👤 Created user: ${u.email} (${u.role})`);
    }

    // ── Create Employees ───────────────────────────────────
    const employeesData = [
      {
        userId: users[2]._id,
        fullName: 'Tamanna saini',
        employeeId: '13257062',
        branch: 'defense security',
        position: 'solider',
        email: 'tamannasaini860@gmail.com',
        isVerified: true,
        isBiometricDone: true,
      },
      {
        userId: users[3]._id,
        fullName: 'sonakshi',
        employeeId: '13257035',
        branch: 'defense security',
        position: 'solider',
        email: 'sonakshidhiman12@gmail.com',
        isVerified: true,
        isBiometricDone: true,
      },
    ];

    const employees = [];
    for (const e of employeesData) {
      const emp = await Employee.create(e);
      employees.push(emp);
      console.log(`🪪 Created employee: ${e.fullName} (${e.employeeId})`);
    }

    // ── Create Cards ───────────────────────────────────────
    const cardsData = [
      {
        cardNumber: '51F2D26',
        employeeId: employees[0]._id,
        userId: users[2]._id,
        isActive: true,
        accessCount: 15,
      },
      {
        cardNumber: 'SGS-20240405-1002',
        employeeId: employees[1]._id,
        userId: users[3]._id,
        isActive: true,
        accessCount: 5,
      },
    ];

    for (const c of cardsData) {
      await Card.create(c);
      console.log(`💳 Created card: ${c.cardNumber}`);
    }

    // ── Create Sample Access Logs ──────────────────────────
    const logs = [
      { cardNumber: '51F2D26', employeeName: 'Tamanna saini', employeeId: '13257062', event: 'ACCESS_GRANTED', step: 'GATE', message: 'Auth success' },
      { cardNumber: 'SGS-20240405-1002', employeeName: 'sonakshi', employeeId: '13257035', event: 'ACCESS_GRANTED', step: 'GATE', message: 'Auth success' },
    ];

    for (const log of logs) {
      await AccessLog.create(log);
    }
    console.log(`📝 Created accessibility log entries`);

    console.log('\n✅ Seed complete!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
};

seed();
