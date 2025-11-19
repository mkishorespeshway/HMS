const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const { sendMail } = require('../utils/mailer');
const Appointment = require('../models/Appointment');

// Create doctor (admin)
router.post('/doctors', authenticate, authorize(['admin']), async (req, res) => {
  const {
    name,
    email,
    phone,
    specializations,
    clinic,
    city,
    fees,
    slotDurationMins
  } = req.body;

  if (!name || !email) return res.status(400).json({ message: 'Name and email required' });

  const existing = await User.findOne({ email });
  if (existing) return res.status(400).json({ message: 'Email already exists' });

  const bcrypt = require('bcrypt');
  const tmpPassword = Math.random().toString(36).slice(-10);
  const passwordHash = await bcrypt.hash(tmpPassword, 10);

  const user = await User.create({
    name,
    email,
    phone,
    passwordHash,
    role: 'doctor',
    isDoctorApproved: true
  });

  const specs = Array.isArray(specializations)
    ? specializations
    : String(specializations || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

  const profile = await DoctorProfile.create({
    user: user._id,
    specializations: specs,
    clinic: { name: clinic || '', city: city || '' },
    consultationFees: fees ? Number(fees) : undefined,
    slotDurationMins: slotDurationMins ? Number(slotDurationMins) : undefined
  });

  try {
    if (user.email) await sendMail(user.email, 'Your Doctor Account', `Your account has been created. Email: ${user.email}\nTemporary password: ${tmpPassword}`);
  } catch (e) {}

  res.json({
    user: { id: user._id, name: user.name, email: user.email, role: user.role },
    profile,
    tempPassword: tmpPassword
  });
});

router.get('/pending-doctors', authenticate, authorize(['admin']), async (req, res) => {
  const users = await User.find({ role: 'doctor', isDoctorApproved: false }).select('-passwordHash');
  const ids = users.map(u => u._id);
  const profiles = await DoctorProfile.find({ user: { $in: ids } });
  const map = new Map(profiles.map(p => [String(p.user), p]));
  const out = users.map(u => ({ user: u, profile: map.get(String(u._id)) || null }));
  res.json(out);
});

router.post('/doctors/:id/approve', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user || user.role !== 'doctor') return res.status(404).json({ message: 'Doctor not found' });
  user.isDoctorApproved = true;
  await user.save();
  res.json({ ok: true });
});

router.post('/doctors/:id/reject', authenticate, authorize(['admin']), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = await User.findById(id);
  if (!user || user.role !== 'doctor') return res.status(404).json({ message: 'Doctor not found' });
  user.isDoctorApproved = false;
  await user.save();
  try {
    if (user.email) await sendMail(user.email, 'Doctor Profile Rejected', reason || 'Your doctor profile was rejected.');
  } catch (e) {}
  res.json({ ok: true });
});

// List all appointments (admin)
router.get('/appointments', authenticate, authorize(['admin']), async (req, res) => {
  const list = await Appointment.find({})
    .populate('doctor', 'name')
    .populate('patient', 'name')
    .sort({ date: -1, startTime: -1 });
  res.json(list);
});

module.exports = router;