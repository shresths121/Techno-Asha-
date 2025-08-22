import express from "express";
import Patient from "../models/Patient.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { catchAsync, NotFoundError, ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

router.get("/me", protect, requireRole("patient"), catchAsync(async (req, res) => {
  const patient = await Patient.findOne({ user: req.user._id }).populate("user", "name email role");
  if (!patient) {
    throw new NotFoundError("Patient profile");
  }
  res.json({
    success: true,
    data: patient
  });
}));

/** Doctors attached to this patient via issues/recommend */
router.get("/me/doctors", protect, requireRole("patient"), catchAsync(async (req, res) => {
  const me = await Patient.findOne({ user: req.user._id });
  if (!me) {
    throw new NotFoundError("Patient profile");
  }
  
  const docs = await (await import('../models/Doctor.js')).default
    .find({ patients: me._id })
    .populate('user', 'name email')
    .select('specialty city patients');
  
  res.json({
    success: true,
    data: docs
  });
}));

router.get("/:id", protect, catchAsync(async (req, res) => {
  const patient = await Patient.findById(req.params.id).populate("user", "name email");
  if (!patient) {
    throw new NotFoundError("Patient");
  }
  res.json({
    success: true,
    data: patient
  });
}));

/** Update patient profile */
router.patch("/me", protect, requireRole("patient"), catchAsync(async (req, res) => {
  const { age, gender, location, emergencyContact } = req.body;
  
  if (age !== undefined && (isNaN(age) || age < 0 || age > 150)) {
    throw new ValidationError("Please provide a valid age (0-150)");
  }
  
  if (gender && !['Male', 'Female', 'Other'].includes(gender)) {
    throw new ValidationError("Please provide a valid gender");
  }
  
  // Validate location if provided
  if (location) {
    if (location.latitude && (location.latitude < -90 || location.latitude > 90)) {
      throw new ValidationError("Invalid latitude value");
    }
    if (location.longitude && (location.longitude < -180 || location.longitude > 180)) {
      throw new ValidationError("Invalid longitude value");
    }
  }
  
  const updated = await Patient.findOneAndUpdate(
    { user: req.user._id },
    { age, gender, location, emergencyContact },
    { new: true, runValidators: true }
  ).populate("user", "name email role language");
  
  if (!updated) {
    throw new NotFoundError("Patient profile");
  }
  
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: updated
  });
}));

export default router;
