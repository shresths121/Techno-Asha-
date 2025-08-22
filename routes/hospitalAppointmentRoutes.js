import express from "express";
import HospitalAppointment from "../models/HospitalAppointment.js";
import HospitalDoctor from "../models/HospitalDoctor.js";
import Patient from "../models/Patient.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { catchAsync, ValidationError, NotFoundError, ConflictError } from "../middleware/errorHandler.js";

const router = express.Router();

// Input validation middleware
const validateAppointmentData = (req, res, next) => {
  const { hospitalDoctorId, date, time, notes } = req.body;
  
  if (!hospitalDoctorId) {
    throw new ValidationError("Doctor ID is required");
  }
  
  if (!date) {
    throw new ValidationError("Appointment date is required");
  }
  
  if (!time) {
    throw new ValidationError("Appointment time is required");
  }
  
  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) {
    throw new ValidationError("Invalid date format");
  }
  
  // Check if appointment is in the future
  if (appointmentDate <= new Date()) {
    throw new ValidationError("Appointment must be scheduled for a future date");
  }
  
  // Limit notes length
  if (notes && notes.length > 500) {
    throw new ValidationError("Notes must be less than 500 characters");
  }
  
  next();
};

/** Patient creates appointment with hospital doctor */
router.post("/", protect, requireRole("patient"), validateAppointmentData, catchAsync(async (req, res) => {
  const { hospitalDoctorId, date, time, notes } = req.body;
  
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new NotFoundError("Patient profile");
  }

  const hospitalDoctor = await HospitalDoctor.findById(hospitalDoctorId);
  if (!hospitalDoctor) {
    throw new NotFoundError("Doctor");
  }

  // Conflict check: block overlapping appointments within +/- 30 minutes for this doctor
  const requested = new Date(date);
  const windowStart = new Date(requested.getTime() - 30 * 60000);
  const windowEnd = new Date(requested.getTime() + 30 * 60000);
  const conflict = await HospitalAppointment.findOne({
    hospitalDoctor: hospitalDoctor._id,
    status: { $in: ["pending", "confirmed"] },
    date: { $gte: windowStart, $lte: windowEnd }
  });
  
  if (conflict) {
    throw new ConflictError("Selected time is not available for this doctor. Please choose another time.");
  }

  const appt = await HospitalAppointment.create({
    hospitalDoctor: hospitalDoctor._id,
    patient: patient._id,
    date: requested,
    time: time,
    notes: notes?.trim(),
    hospital: hospitalDoctor.hospital
  });

  res.status(201).json({
    success: true,
    message: "Appointment created successfully",
    data: appt
  });
}));

/** Get patient's appointments */
router.get("/patient", protect, requireRole("patient"), catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new NotFoundError("Patient profile");
  }

  const appointments = await HospitalAppointment.find({ patient: patient._id })
    .populate('hospitalDoctor', 'name specialty')
    .populate('hospital', 'name city state')
    .sort({ date: 1 });

  res.json({
    success: true,
    data: {
      appointments,
      count: appointments.length
    }
  });
}));

/** Get hospital doctor's appointments */
router.get("/doctor/:doctorId", protect, requireRole("hospital"), catchAsync(async (req, res) => {
  const { doctorId } = req.params;
  
  const appointments = await HospitalAppointment.find({ hospitalDoctor: doctorId })
    .populate('patient', 'user')
    .populate('hospital', 'name')
    .sort({ date: 1 });

  res.json({
    success: true,
    data: {
      appointments,
      count: appointments.length
    }
  });
}));

/** Update appointment status (confirm/cancel/complete) */
router.patch("/:appointmentId/status", protect, requireRole("hospital"), catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body;
  
  if (!["pending", "confirmed", "cancelled", "completed"].includes(status)) {
    throw new ValidationError("Invalid status");
  }
  
  const appointment = await HospitalAppointment.findByIdAndUpdate(
    appointmentId,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!appointment) {
    throw new NotFoundError("Appointment");
  }
  
  res.json({
    success: true,
    message: "Appointment status updated successfully",
    data: {
      appointment
    }
  });
}));

/** Cancel appointment (patient) */
router.patch("/:appointmentId/cancel", protect, requireRole("patient"), catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  
  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new NotFoundError("Patient profile");
  }
  
  const appointment = await HospitalAppointment.findOneAndUpdate(
    { _id: appointmentId, patient: patient._id },
    { status: "cancelled" },
    { new: true, runValidators: true }
  );
  
  if (!appointment) {
    throw new NotFoundError("Appointment");
  }
  
  res.json({
    success: true,
    message: "Appointment cancelled successfully",
    data: {
      appointment
    }
  });
}));

/** Get appointment by ID */
router.get("/:appointmentId", protect, catchAsync(async (req, res) => {
  const { appointmentId } = req.params;
  
  const appointment = await HospitalAppointment.findById(appointmentId)
    .populate('hospitalDoctor', 'name specialty experience qualifications')
    .populate('patient', 'user age gender')
    .populate('hospital', 'name city state address');
  
  if (!appointment) {
    throw new NotFoundError("Appointment");
  }
  
  res.json({
    success: true,
    data: {
      appointment
    }
  });
}));

export default router;
