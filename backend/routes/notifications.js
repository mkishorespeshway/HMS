const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const Notification = require('../models/Notification');

router.get('/', authenticate, async (req, res) => {
  const { unread } = req.query || {};
  const filter = { user: req.user._id };
  if (String(unread) === '1') filter.read = false;
  const list = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
  res.json(list);
});

router.put('/:id/read', authenticate, async (req, res) => {
  const { id } = req.params;
  const n = await Notification.findOne({ _id: id, user: req.user._id });
  if (!n) return res.status(404).json({ message: 'Not found' });
  n.read = true;
  await n.save();
  res.json({ ok: true });
});

router.put('/read-all', authenticate, async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { $set: { read: true } });
  res.json({ ok: true });
});

router.delete('/', authenticate, async (req, res) => {
  await Notification.deleteMany({ user: req.user._id });
  res.json({ ok: true });
});

router.delete('/:id', authenticate, async (req, res) => {
  const { id } = req.params;
  await Notification.deleteOne({ _id: id, user: req.user._id });
  res.json({ ok: true });
});

module.exports = router;
