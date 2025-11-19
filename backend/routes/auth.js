const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');


// Register
router.post('/register', async (req, res) => {
const { name, email, password, role } = req.body;
if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });
const existing = await User.findOne({ email });
if (existing) return res.status(400).json({ message: 'Email in use' });
const passwordHash = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, passwordHash, role: role || 'patient' });
// If doctor, set isDoctorApproved=false by default
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});


// Login
router.post('/login', async (req, res) => {
const { email, password } = req.body;
if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

 // Static admin login via env
 const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
 const adminPass = (process.env.ADMIN_PASSWORD || '').trim();
 const reqEmail = String(email).trim().toLowerCase();
 const reqPass = String(password).trim();
 if (adminEmail && adminPass && reqEmail === adminEmail && reqPass === adminPass) {
  let admin = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10);
    admin = await User.create({ name: 'Administrator', email: process.env.ADMIN_EMAIL, passwordHash, role: 'admin' });
  }
  const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
  return res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role } });
}
const user = await User.findOne({ email });
if (!user) return res.status(400).json({ message: 'Invalid credentials' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(400).json({ message: 'Invalid credentials' });
// if doctor login must be approved
if (user.role === 'doctor' && !user.isDoctorApproved) return res.status(403).json({ message: 'Doctor not approved yet' });
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '1d' });
res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
});


module.exports = router;