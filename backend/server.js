require('dotenv').config();
const express = require('express');
const cors = require('cors');
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


const app = express();
app.use(cors());
app.options('*', cors());
app.use(express.json());


connectDB();


app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => res.send('DoctorConnect API'));


const PORT = 5000;
app.listen(PORT, () => console.log(`Server listening on ${PORT}`));
