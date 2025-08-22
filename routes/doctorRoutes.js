import express from "express";
import Doctor from "../models/Doctor.js";
import User from "../models/User.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { catchAsync, NotFoundError, ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

/** Public: list doctors with optional filters */
router.get("/", catchAsync(async (req, res) => {
  const { specialty, city } = req.query;
  const filter = {};
  
  if (specialty) filter.specialty = specialty;
  if (city) filter.city = city;

  const docs = await Doctor.find(filter).populate("user", "name email");
  res.json({
    success: true,
    count: docs.length,
    data: docs
  });
}));

/** Doctor's own profile */
router.get("/me", protect, requireRole("doctor"), catchAsync(async (req, res) => {
  const doctor = await Doctor.findOne({ user: req.user._id })
    .populate("user", "name email role")
    .populate({ path: "patients", populate: { path: "user", select: "name email role" } });
  
  if (!doctor) {
    throw new NotFoundError("Doctor profile");
  }
  
  res.json({
    success: true,
    data: doctor
  });
}));

/** Get doctors for a given patient (attached via issues/recommend) */
router.get("/for-patient/:id", protect, catchAsync(async (req, res) => {
  const { id } = req.params;
  const docs = await Doctor.find({ patients: id })
    .populate("user", "name email")
    .populate({ path: "patients", select: "_id" });
  
  res.json({
    success: true,
    count: docs.length,
    data: docs
  });
}));

/** Get a doctor by id */
router.get("/:id", catchAsync(async (req, res) => {
  const doc = await Doctor.findById(req.params.id).populate("user", "name email");
  if (!doc) {
    throw new NotFoundError("Doctor");
  }
  res.json({
    success: true,
    data: doc
  });
}));

/** Update my profile: city, experience */
router.patch("/me", protect, requireRole("doctor"), catchAsync(async (req, res) => {
  const { city, experience } = req.body;
  
  // Validate city if provided
  if (city !== undefined && (!city || city.trim().length < 2)) {
    throw new ValidationError("Please provide a valid city (at least 2 characters)");
  }
  
  // Validate experience if provided
  if (experience !== undefined && (isNaN(experience) || experience < 0 || experience > 50)) {
    throw new ValidationError("Please provide valid experience years (0-50)");
  }
  
  const updated = await Doctor.findOneAndUpdate(
    { user: req.user._id },
    { $set: { city, experience } },
    { new: true }
  ).populate("user", "name email role");
  
  if (!updated) {
    throw new NotFoundError("Doctor profile");
  }
  
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: updated
  });
}));

export default router;
