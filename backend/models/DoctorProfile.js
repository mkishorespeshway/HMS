const mongoose = require('mongoose');


const doctorProfileSchema = new mongoose.Schema({
user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
specializations: [String],
qualifications: [String],
experienceYears: Number,
registrationNumber: String,
clinic: {
name: String,
address: String,
city: String
},
consultationFees: Number,
languages: [String],
weeklyAvailability: [{ day: Number, from: String, to: String }],
slotDurationMins: { type: Number, default: 15 }
}, { timestamps: true });


module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);