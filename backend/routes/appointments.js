const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/auth");
const Appointment = require("../models/Appointment");
const DoctorProfile = require("../models/DoctorProfile");
const { generateSlots } = require("../utils/slotGenerator");
const { sendMail } = require("../utils/mailer");

// -------------------------------
// Get available slots for a doctor
// -------------------------------
router.get("/slots/:doctorId", async (req, res) => {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date)
        return res.status(400).json({ message: "Date is required" });

    const profile = await DoctorProfile.findOne({ user: doctorId });
    if (!profile)
        return res.status(404).json({ message: "Doctor profile not found" });

    const day = new Date(date).getDay(); // 0-6 (Sun-Sat)
    let todaysAvailability = profile.weeklyAvailability.filter(a => a.day === day);

    // Fallback availability if none configured for the day: 09:00-17:00
    if (!todaysAvailability || todaysAvailability.length === 0) {
        todaysAvailability = [{ day, from: "09:00", to: "17:00" }];
    }

    const duration = profile.slotDurationMins || 15;
    const slotsMap = generateSlots(todaysAvailability, duration);
    const allSlots = slotsMap[day] || [];

    // Remove already booked slots
    const booked = await Appointment.find({
        doctor: doctorId,
        date: date,
        status: { $in: ["PENDING", "CONFIRMED"] }
    });

    const availableSlots = allSlots.filter(slot =>
        !booked.some(b => b.startTime === slot.start)
    );

    res.json(availableSlots);
});

// -----------------------------------
// Book Appointment
// -----------------------------------
router.post("/", authenticate, async (req, res) => {
    const { doctorId, date, startTime, endTime, type, beneficiaryType, beneficiaryName } = req.body;

    if (!doctorId || !date || !startTime || !endTime)
        return res.status(400).json({ message: "Missing fields" });

    // Check conflicts
    const conflict = await Appointment.findOne({
        doctor: doctorId,
        date,
        startTime,
        status: { $in: ["PENDING", "CONFIRMED"] }
    });

    if (conflict)
        return res.status(409).json({ message: "Slot already booked" });

    const profile = await DoctorProfile.findOne({ user: doctorId });
    const fee = profile?.consultationFees || 0;

    let appointment = await Appointment.create({
        patient: req.user._id,
        doctor: doctorId,
        date,
        startTime,
        endTime,
        type,
        status: "PENDING",
        paymentStatus: "PENDING",
        fee,
        beneficiaryType: beneficiaryType || "self",
        beneficiaryName: beneficiaryName || undefined
    });

    if (appointment.type === "online") {
        appointment.meetingLink = `https://meet.jit.si/doctorconnect-${appointment._id}`;
        await appointment.save();
    }

    res.json(appointment);
});

router.post("/:id/pay", authenticate, async (req, res) => {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    if (String(appt.patient) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
    if (appt.paymentStatus === "PAID") return res.json(appt);
    appt.paymentStatus = "PAID";
    appt.status = "CONFIRMED";
    await appt.save();

    const populated = await Appointment.findById(id)
        .populate("doctor", "name email")
        .populate("patient", "name email");

    const when = `${populated.date} ${populated.startTime}-${populated.endTime}`;
    const subject = "Appointment Confirmed";
    const textPatient = `Your appointment with ${populated.doctor.name} is confirmed for ${when}.`;
    const textDoctor = `New appointment confirmed with ${populated.patient.name} for ${when}.`;
    try {
        if (populated.patient.email) await sendMail(populated.patient.email, subject, textPatient);
        if (populated.doctor.email) await sendMail(populated.doctor.email, subject, textDoctor);
    } catch (e) {}

    res.json(populated);
});

router.get("/today", authenticate, async (req, res) => {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors" });
    const today = new Date().toISOString().slice(0, 10);
    const list = await Appointment.find({ doctor: req.user._id, date: today })
        .populate("patient", "name email")
        .sort({ startTime: 1 });
    res.json(list);
});

router.put("/:id/complete", authenticate, async (req, res) => {
    if (req.user.role !== "doctor") return res.status(403).json({ message: "Only doctors" });
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    if (String(appt.doctor) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
    appt.status = "COMPLETED";
    await appt.save();
    res.json(appt);
});

router.put("/:id/cancel", authenticate, async (req, res) => {
    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) return res.status(404).json({ message: "Appointment not found" });
    const uid = String(req.user._id);
    const isOwner = String(appt.patient) === uid || String(appt.doctor) === uid;
    const isAdmin = req.user.role === "admin";
    if (!isOwner && !isAdmin) return res.status(403).json({ message: "Forbidden" });
    appt.status = "CANCELLED";
    await appt.save();
    res.json(appt);
});

router.put("/:id/accept", authenticate, async (req, res) => {
  const { id } = req.params;
  const { date, startTime } = req.body || {};
  let appt = await Appointment.findById(id);
  if (!appt && date && startTime) {
    appt = await Appointment.findOne({ doctor: req.user._id, date, startTime });
  }
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (req.user.role !== "doctor" || String(appt.doctor) !== String(req.user._id)) {
    return res.status(403).json({ message: "Only the doctor can accept" });
  }
  appt.status = "CONFIRMED";
  await appt.save();
  res.json(appt);
});

router.put("/:id/reject", authenticate, async (req, res) => {
  const { id } = req.params;
  const { date, startTime } = req.body || {};
  let appt = await Appointment.findById(id);
  if (!appt && date && startTime) {
    appt = await Appointment.findOne({ doctor: req.user._id, date, startTime });
  }
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  const uid = String(req.user._id);
  const isDoctor = req.user.role === "doctor" && String(appt.doctor) === uid;
  const isAdmin = req.user.role === "admin";
  if (!isDoctor && !isAdmin) return res.status(403).json({ message: "Forbidden" });
  appt.status = "CANCELLED";
  await appt.save();
  res.json(appt);
});

router.post("/:id/prescription", authenticate, async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const appt = await Appointment.findById(id).populate("patient", "name email");
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (req.user.role !== "doctor" || String(appt.doctor) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
  appt.prescriptionText = text || "";
  await appt.save();

  const url = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/prescription/${id}`;
  try {
    if (appt.patient.email) await sendMail(appt.patient.email, "Prescription Available", `Your prescription is ready: ${url}`);
  } catch (e) {}
  res.json({ ok: true });
});

// -----------------------------------
// View my appointments (patient or doctor)
// -----------------------------------
router.get("/mine", authenticate, async (req, res) => {
  const filter = req.user.role === "doctor"
    ? { doctor: req.user._id }
    : { patient: req.user._id };

  const list = await Appointment.find(filter)
    .populate("doctor", "name")
    .populate("patient", "name");

  res.json(list);
});

router.get("/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findById(id)
    .populate("doctor", "name email")
    .populate("patient", "name email");
  if (!appt) return res.status(404).json({ message: "Appointment not found" });
  if (String(appt.patient._id) !== String(req.user._id) && String(appt.doctor._id) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });
  res.json(appt);
});


module.exports = router;
