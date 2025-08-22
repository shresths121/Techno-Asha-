import express from "express";
import Appointment from "../models/Appointment.js";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { catchAsync, ValidationError, NotFoundError, ConflictError } from "../middleware/errorHandler.js";

const router = express.Router();

// --------------------- Validation ---------------------
const validateAppointmentData = (req, res, next) => {
  const { doctorId, date, notes } = req.body;

  if (!doctorId) throw new ValidationError("Doctor ID is required");
  if (!date) throw new ValidationError("Appointment date is required");

  const appointmentDate = new Date(date);
  if (isNaN(appointmentDate.getTime())) throw new ValidationError("Invalid date format");
  if (appointmentDate <= new Date()) throw new ValidationError("Appointment must be in the future");

  if (notes && notes.length > 500) throw new ValidationError("Notes must be less than 500 characters");

  next();
};

// --------------------- Patient creates appointment ---------------------
router.post(
  "/",
  protect,
  requireRole("patient"),
  validateAppointmentData,
  catchAsync(async (req, res) => {
    const { doctorId, date, notes } = req.body;

    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) throw new NotFoundError("Patient profile not found");

    const doctor = await Doctor.findById(doctorId).populate("hospital");
    if (!doctor) throw new NotFoundError("Doctor not found");

    // Conflict check (±30 mins)
    const requested = new Date(date);
    const windowStart = new Date(requested.getTime() - 30 * 60000);
    const windowEnd = new Date(requested.getTime() + 30 * 60000);

    const conflict = await Appointment.findOne({
      doctor: doctor._id,
      status: { $in: ["pending", "confirmed"] },
      date: { $gte: windowStart, $lte: windowEnd },
    });

    if (conflict) {
      throw new ConflictError("Selected time is not available. Please choose another slot.");
    }

    // ✅ Auto-link hospital from doctor
    const appt = await Appointment.create({
      doctor: doctor._id,
      hospital: doctor.hospital?._id,   // auto-attach hospital
      patient: patient._id,
      date: requested,
      notes: notes?.trim(),
    });

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      data: appt,
    });
  })
);

// --------------------- Doctor confirms ---------------------
router.patch("/:id/confirm", protect, requireRole("doctor"), catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new NotFoundError("Doctor profile not found");

  const appt = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: doctor._id },
    { status: "confirmed" },
    { new: true }
  );

  if (!appt) throw new NotFoundError("Appointment not found");

  res.json({ success: true, message: "Appointment confirmed", data: appt });
}));

// --------------------- Doctor cancels ---------------------
router.patch("/:id/cancel", protect, requireRole("doctor"), catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new NotFoundError("Doctor profile not found");

  const appt = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: doctor._id },
    { status: "cancelled" },
    { new: true }
  );

  if (!appt) throw new NotFoundError("Appointment not found");

  res.json({ success: true, message: "Appointment cancelled", data: appt });
}));

// --------------------- Doctor reschedules ---------------------
router.patch("/:id/reschedule", protect, requireRole("doctor"), catchAsync(async (req, res) => {
  const { date } = req.body;
  if (!date) throw new ValidationError("New date is required");

  const newDate = new Date(date);
  if (isNaN(newDate.getTime()) || newDate <= new Date()) {
    throw new ValidationError("Invalid or past date");
  }

  const doctor = await Doctor.findOne({ user: req.user._id });
  if (!doctor) throw new NotFoundError("Doctor profile not found");

  const windowStart = new Date(newDate.getTime() - 30 * 60000);
  const windowEnd = new Date(newDate.getTime() + 30 * 60000);

  const conflict = await Appointment.findOne({
    _id: { $ne: req.params.id },
    doctor: doctor._id,
    status: { $in: ["pending", "confirmed"] },
    date: { $gte: windowStart, $lte: windowEnd },
  });

  if (conflict) throw new ConflictError("New time not available");

  const appt = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctor: doctor._id },
    { date: newDate, status: "pending" },
    { new: true }
  );

  if (!appt) throw new NotFoundError("Appointment not found");

  res.json({ success: true, message: "Appointment rescheduled", data: appt });
}));

// --------------------- Get my appointments ---------------------
router.get("/mine", protect, catchAsync(async (req, res) => {
  if (req.user.role === "patient") {
    const patient = await Patient.findOne({ user: req.user._id });
    if (!patient) throw new NotFoundError("Patient profile not found");

    const appts = await Appointment.find({ patient: patient._id })
      .populate("doctor")
      .populate("hospital")
      .populate({ path: "doctor", populate: { path: "user", select: "name email" } });

    return res.json({ success: true, count: appts.length, data: appts });
  }

  if (req.user.role === "doctor") {
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) throw new NotFoundError("Doctor profile not found");

    const appts = await Appointment.find({ doctor: doctor._id })
      .populate("patient")
      .populate("hospital")
      .populate({ path: "patient", populate: { path: "user", select: "name email" } });

    return res.json({ success: true, count: appts.length, data: appts });
  }

  throw new ValidationError("Unknown role");
}));

export default router;
