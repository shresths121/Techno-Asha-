import express from "express";
import { catchAsync } from "../middleware/errorHandler.js";
import HospitalDoctor from "../models/HospitalDoctor.js";
import Hospital from "../models/Hospital.js";

const router = express.Router();

// Get all hospital doctors (for patient search)
router.get("/", catchAsync(async (req, res) => {
  const { specialty, city, state } = req.query;
  
  let query = { isActive: true };
  
  if (specialty) {
    query.specialty = specialty;
  }
  
  if (city) {
    query.city = { $regex: city, $options: 'i' };
  }
  
  if (state) {
    query.state = { $regex: state, $options: 'i' };
  }
  
  const doctors = await HospitalDoctor.find(query)
    .populate('hospital', 'name city state')
    .sort({ experience: -1, name: 1 });
  
  res.json({
    success: true,
    data: {
      doctors,
      count: doctors.length
    }
  });
}));

// Get doctors by hospital
router.get("/hospital/:hospitalId", catchAsync(async (req, res) => {
  const { hospitalId } = req.params;
  
  const doctors = await HospitalDoctor.find({ 
    hospital: hospitalId, 
    isActive: true 
  }).sort({ name: 1 });
  
  res.json({
    success: true,
    data: {
      doctors,
      count: doctors.length
    }
  });
}));

// Add new doctor to hospital
router.post("/", catchAsync(async (req, res) => {
  const { 
    hospitalId, 
    name, 
    email, 
    phone, 
    specialty, 
    experience, 
    qualifications,
    city,
    state,
    address 
  } = req.body;
  
  // Check if hospital exists
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    throw new Error("Hospital not found");
  }
  
  // Check if doctor email already exists in this hospital
  const existingDoctor = await HospitalDoctor.findOne({ 
    hospital: hospitalId, 
    email: email.toLowerCase() 
  });
  
  if (existingDoctor) {
    throw new Error("Doctor with this email already exists in this hospital");
  }
  
  // Create new doctor
  const doctor = new HospitalDoctor({
    hospital: hospitalId,
    name,
    email: email.toLowerCase(),
    phone,
    specialty,
    experience: experience || 0,
    qualifications,
    city: city || hospital.city,
    state: state || hospital.state,
    address: address || hospital.address,
    coordinates: hospital.coordinates
  });
  
  await doctor.save();
  
  res.status(201).json({
    success: true,
    message: "Doctor added successfully",
    data: {
      doctor
    }
  });
}));

// Update doctor
router.patch("/:doctorId", catchAsync(async (req, res) => {
  const { doctorId } = req.params;
  const updateData = req.body;
  
  const doctor = await HospitalDoctor.findByIdAndUpdate(
    doctorId,
    updateData,
    { new: true, runValidators: true }
  );
  
  if (!doctor) {
    throw new Error("Doctor not found");
  }
  
  res.json({
    success: true,
    message: "Doctor updated successfully",
    data: {
      doctor
    }
  });
}));

// Delete doctor (soft delete)
router.delete("/:doctorId", catchAsync(async (req, res) => {
  const { doctorId } = req.params;
  
  const doctor = await HospitalDoctor.findByIdAndUpdate(
    doctorId,
    { isActive: false },
    { new: true }
  );
  
  if (!doctor) {
    throw new Error("Doctor not found");
  }
  
  res.json({
    success: true,
    message: "Doctor removed successfully"
  });
}));

// Get doctor by ID
router.get("/:doctorId", catchAsync(async (req, res) => {
  const { doctorId } = req.params;
  
  const doctor = await HospitalDoctor.findById(doctorId)
    .populate('hospital', 'name city state address');
  
  if (!doctor) {
    throw new Error("Doctor not found");
  }
  
  res.json({
    success: true,
    data: {
      doctor
    }
  });
}));

export default router;
