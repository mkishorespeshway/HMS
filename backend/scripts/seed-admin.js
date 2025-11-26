require('dotenv').config();
const bcrypt = require('bcrypt');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();
  const email = 'admin@hms.com';
  const name = 'Administrator';
  const password = 'admin123';
  const existing = await User.findOne({ email });
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing) {
    existing.passwordHash = passwordHash;
    existing.role = 'admin';
    await existing.save();
    console.log(`Admin updated: ${email}`);
  } else {
    const user = await User.create({ name, email, passwordHash, role: 'admin' });
    console.log(`Admin created: ${user.email}`);
  }
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });

