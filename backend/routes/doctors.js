const express = require('express');
const router = express.Router();
const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const { authenticate } = require('../middlewares/auth');


// Public: search doctors
router.get('/', async (req, res) => {
  const { q, city, specialization, user } = req.query;
  const filter = {};
  if (city) filter['clinic.city'] = new RegExp(city, 'i');
  if (specialization) filter['specializations'] = specialization;
  if (q) filter['$or'] = [ { 'clinic.name': new RegExp(q,'i') }, { 'specializations': new RegExp(q,'i') } ];
  if (user) filter['user'] = user;

  const doctors = await DoctorProfile.find(filter).populate({
    path: 'user',
    select: '-passwordHash',
    match: { role: 'doctor', isDoctorApproved: true }
  });
  res.json(doctors.filter(d => !!d.user));
});


// Protected: submit or update profile (doctor user)
router.post('/me', authenticate, async (req, res) => {
const user = req.user;
if (user.role !== 'doctor') return res.status(403).json({ message: 'Only doctors' });
const payload = req.body;
let profile = await DoctorProfile.findOne({ user: user._id });
if (!profile) profile = new DoctorProfile({ user: user._id, ...payload });
else Object.assign(profile, payload);
await profile.save();
res.json(profile);
});


module.exports = router;