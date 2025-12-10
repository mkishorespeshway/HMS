require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});


const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const adminRoutes = require('./routes/admin');
const notificationRoutes = require('./routes/notifications');
const jwt = require('jsonwebtoken');
const { notifyChat } = require('./utils/notify');


const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

connectDB();

// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

io.on('connection', (socket) => {
  try {
    const token = socket.handshake?.auth?.token || '';
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.id) socket.join(`user:${String(decoded.id)}`);
    }
  } catch (_) {}
  socket.on('disconnect', () => {});
  socket.on('chat:new', async (msg) => {
    try {
      socket.broadcast.emit('chat:new', msg);
    } catch (_) {}
    try {
      await notifyChat(app, msg);
    } catch (_) {}
  });
  socket.on('meet:update', async (msg) => {
    try {
      socket.broadcast.emit('meet:update', msg);
    } catch (_) {}
    try {
      const { apptId, actor, event } = msg || {};
      const Appointment = require('./models/Appointment');
      const a = await Appointment.findById(apptId).populate('patient','name').populate('doctor','name');
      if (!a) return;
      const id = String(a._id || a.id || '');
      const start = new Date(a.date);
      const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
      start.setHours(sh, sm, 0, 0);
      const now = Date.now();
      if (event === 'join' && String(actor).toLowerCase() === 'patient') {
        await createNotification(app, { userId: a.doctor, title: 'Patient Joined', message: 'Patient has joined and is waiting. Click Join Meet.', type: 'meet', link: '/doctor/dashboard', dedupeKey: `pt_join_${id}`, apptId: id });
        if (now > start.getTime()) {
          await createNotification(app, { userId: a.patient, title: 'Late Join', message: 'You are late. Remaining duration will be reduced automatically.', type: 'meet', link: '/appointments', dedupeKey: `late_${id}_p`, apptId: id });
        }
      } else if (event === 'join' && String(actor).toLowerCase() === 'doctor') {
        await createNotification(app, { userId: a.patient, title: 'Doctor Joined', message: 'Doctor is available and waiting. Join Meet now.', type: 'meet', link: '/appointments', dedupeKey: `doc_join_${id}`, apptId: id });
        if (now > start.getTime()) {
          await createNotification(app, { userId: a.doctor, title: 'Late Join', message: 'You are late. Remaining duration will be reduced automatically.', type: 'meet', link: '/doctor/dashboard', dedupeKey: `late_${id}_d`, apptId: id });
        }
      } else if (event === 'exit' && String(actor).toLowerCase() === 'patient') {
        await createNotification(app, { userId: a.doctor, title: 'Patient Left', message: 'Patient left the call. They may rejoin while time remains.', type: 'meet', link: '/doctor/dashboard', dedupeKey: `pt_exit_${id}`, apptId: id });
      } else if (event === 'exit' && String(actor).toLowerCase() === 'doctor') {
        await createNotification(app, { userId: a.patient, title: 'Doctor Left', message: 'Doctor left the call. Please wait or rejoin later.', type: 'meet', link: '/appointments', dedupeKey: `doc_exit_${id}`, apptId: id });
      }
    } catch (_) {}
  });
});

app.set('io', io);

const Appointment = require('./models/Appointment');
const { createNotification } = require('./utils/notify');

setInterval(async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const now = Date.now();
    const ahead = new Date(now + 12 * 60 * 60 * 1000);
    const list = await Appointment.find({ date: today, status: { $in: ['PENDING','CONFIRMED'] } }).populate('patient','name').populate('doctor','name');
    for (const a of list) {
      const id = String(a._id || a.id || '');
      const start = new Date(a.date);
      const [sh, sm] = String(a.startTime || '00:00').split(':').map((x) => Number(x));
      start.setHours(sh, sm, 0, 0);
      const end = new Date(a.date);
      const [eh, em] = String(a.endTime || a.startTime || '00:00').split(':').map((x) => Number(x));
      end.setHours(eh, em, 0, 0);
      const tenBefore = start.getTime() - 10 * 60 * 1000;
      const fiveRemain = end.getTime() - 5 * 60 * 1000;
      const oneRemain = end.getTime() - 60 * 1000;
      const windowMs = 60 * 1000;
      if (now >= tenBefore && now < tenBefore + windowMs) {
        await createNotification(app, { userId: a.doctor, title: 'Reminder', message: 'Your consultation starts in 10 minutes. Be ready to join.', type: 'reminder', link: '/doctor/dashboard', dedupeKey: `rem10_${id}` });
        await createNotification(app, { userId: a.patient, title: 'Reminder', message: 'Your consultation starts in 10 minutes. Be ready to join.', type: 'reminder', link: '/appointments', dedupeKey: `rem10p_${id}` });
      }
      if (now >= start.getTime() && now < start.getTime() + windowMs) {
        await createNotification(app, { userId: a.doctor, title: 'Join Meet', message: 'Join Meet is now available — click to start consultation.', type: 'meet', link: '/doctor/dashboard', dedupeKey: `remstart_${id}` });
        await createNotification(app, { userId: a.patient, title: 'Join Meet', message: 'Join Meet is now available — click to start consultation.', type: 'meet', link: '/appointments', dedupeKey: `remstartp_${id}` });
      }
      if (now >= fiveRemain && now < fiveRemain + windowMs) {
        await createNotification(app, { userId: a.doctor, title: 'Time Alert', message: 'Only 5 minutes left in your consultation.', type: 'timer', link: '/doctor/dashboard', dedupeKey: `rem5_${id}` });
        await createNotification(app, { userId: a.patient, title: 'Time Alert', message: 'Only 5 minutes left in your consultation.', type: 'timer', link: '/appointments', dedupeKey: `rem5p_${id}` });
      }
      if (now >= oneRemain && now < oneRemain + windowMs) {
        await createNotification(app, { userId: a.doctor, title: 'Time Alert', message: '1 minute remaining — please conclude conversation.', type: 'timer', link: '/doctor/dashboard', dedupeKey: `rem1_${id}` });
        await createNotification(app, { userId: a.patient, title: 'Time Alert', message: '1 minute remaining — please conclude conversation.', type: 'timer', link: '/appointments', dedupeKey: `rem1p_${id}` });
      }
    }
  } catch (_) {}
}, 60000);


app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);


app.get('/', (req, res) => res.send('DoctorConnect API'));

// Public stats endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const Appointment = require('./models/Appointment');
    const User = require('./models/User');
    const DoctorProfile = require('./models/DoctorProfile');
    const appointments = await Appointment.countDocuments({});
    const doctors = await User.countDocuments({ role: 'doctor', isDoctorApproved: true });
    const distinctSpecs = await DoctorProfile.distinct('specializations');
    const specialties = (Array.isArray(distinctSpecs) ? distinctSpecs : [])
      .map((s) => String(s || '').trim())
      .filter(Boolean).length;
    res.json({ appointments, doctors, specialties });
  } catch (e) {
    res.status(500).json({ message: e.message || 'Failed to fetch stats' });
  }
});


const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server listening on ${PORT}`));
