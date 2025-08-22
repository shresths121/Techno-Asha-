import express from "express";
import Hospital from "../models/Hospital.js";
import { protect, requireRole, protectHospital } from "../middleware/authMiddleware.js";
import { catchAsync, ValidationError, NotFoundError, ConflictError } from "../middleware/errorHandler.js";

const router = express.Router();

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get all hospitals
router.get("/", catchAsync(async (req, res) => {
  const hospitals = await Hospital.find({ isActive: true }).select('-doctors');
  
  res.json({
    success: true,
    data: {
      hospitals,
      count: hospitals.length
    }
  });
}));

// Get hospital by ID
router.get("/:id", catchAsync(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital || !hospital.isActive) {
    throw new NotFoundError("Hospital");
  }
  
  res.json({
    success: true,
    data: { hospital }
  });
}));

// Find nearby hospitals
router.get("/nearby", catchAsync(async (req, res) => {
  const { latitude, longitude, radius = 50 } = req.query; // radius in km
  
  if (!latitude || !longitude) {
    throw new ValidationError("Latitude and longitude are required");
  }
  
  const hospitals = await Hospital.find({
    isActive: true,
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        },
        $maxDistance: radius * 1000 // Convert to meters
      }
    }
  }).select('-doctors');
  
  // Calculate distances
  const hospitalsWithDistance = hospitals.map(hospital => {
    const distance = calculateDistance(
      parseFloat(latitude),
      parseFloat(longitude),
      hospital.coordinates.coordinates[1],
      hospital.coordinates.coordinates[0]
    );
    return {
      ...hospital.toObject(),
      distance: Math.round(distance * 100) / 100
    };
  });
  
  // Sort by distance
  hospitalsWithDistance.sort((a, b) => a.distance - b.distance);
  
  res.json({
    success: true,
    data: {
      hospitals: hospitalsWithDistance,
      count: hospitalsWithDistance.length
    }
  });
}));

// Add new hospital
router.post("/", catchAsync(async (req, res) => {
  const { name, address, city, state, email, phone, emergencyPhone, specialties, latitude, longitude } = req.body;
  
  if (!name || !address || !city || !state || !email) {
    throw new ValidationError("Name, address, city, state, and email are required");
  }
  
  // Check if hospital already exists
  const existingHospital = await Hospital.findOne({ email });
  if (existingHospital) {
    throw new ConflictError("Hospital with this email already exists");
  }
  
  // Create hospital
  const hospital = new Hospital({
    name,
    address,
    city,
    state,
    email,
    phone,
    emergencyPhone,
    specialties: specialties || [],
    coordinates: latitude && longitude ? {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    } : undefined
  });
  
  await hospital.save();
  
  res.status(201).json({
    success: true,
    message: "Hospital added successfully",
    data: { hospital }
  });
}));

// Update hospital
router.patch("/:id", catchAsync(async (req, res) => {
  const { name, address, city, state, phone, emergencyPhone, specialties, latitude, longitude } = req.body;
  
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  // Update fields
  if (name) hospital.name = name;
  if (address) hospital.address = address;
  if (city) hospital.city = city;
  if (state) hospital.state = state;
  if (phone !== undefined) hospital.phone = phone;
  if (emergencyPhone !== undefined) hospital.emergencyPhone = emergencyPhone;
  if (specialties) hospital.specialties = specialties;
  if (latitude && longitude) {
    hospital.coordinates = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
  }
  
  await hospital.save();
  
  res.json({
    success: true,
    message: "Hospital updated successfully",
    data: { hospital }
  });
}));

// Soft delete hospital
router.delete("/:id", catchAsync(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  hospital.isActive = false;
  await hospital.save();
  
  res.json({
    success: true,
    message: "Hospital deleted successfully"
  });
}));

// Get hospital profile (for authenticated hospital)
router.get("/me/profile", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  res.json({
    success: true,
    data: { hospital }
  });
}));

// Update hospital profile
router.patch("/me/profile", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const { name, address, city, state, phone, emergencyPhone, specialties, latitude, longitude } = req.body;
  
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  // Update fields
  if (name) hospital.name = name;
  if (address) hospital.address = address;
  if (city) hospital.city = city;
  if (state) hospital.state = state;
  if (phone !== undefined) hospital.phone = phone;
  if (emergencyPhone !== undefined) hospital.emergencyPhone = emergencyPhone;
  if (specialties) hospital.specialties = specialties;
  if (latitude && longitude) {
    hospital.coordinates = {
      type: "Point",
      coordinates: [parseFloat(longitude), parseFloat(latitude)]
    };
  }
  
  await hospital.save();
  
  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { hospital }
  });
}));

// Add doctor to hospital
router.post("/me/doctors", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const { name, email, phone, specialty, experience, qualifications } = req.body;
  
  if (!name || !email || !specialty) {
    throw new ValidationError("Name, email, and specialty are required");
  }
  
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  // Check if doctor already exists
  const existingDoctor = hospital.doctors.find(doc => doc.email === email);
  if (existingDoctor) {
    throw new ConflictError("Doctor with this email already exists");
  }
  
  // Add doctor
  hospital.doctors.push({
    name,
    email,
    phone,
    specialty,
    experience: experience || 0,
    qualifications,
    isActive: true
  });
  
  await hospital.save();
  
  res.status(201).json({
    success: true,
    message: "Doctor added successfully",
    data: {
      doctor: hospital.doctors[hospital.doctors.length - 1]
    }
  });
}));

// Update doctor in hospital
router.patch("/me/doctors/:doctorId", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const { name, phone, specialty, experience, qualifications, isActive } = req.body;
  
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  const doctor = hospital.doctors.id(req.params.doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor");
  }
  
  // Update fields
  if (name) doctor.name = name;
  if (phone !== undefined) doctor.phone = phone;
  if (specialty) doctor.specialty = specialty;
  if (experience !== undefined) doctor.experience = experience;
  if (qualifications !== undefined) doctor.qualifications = qualifications;
  if (isActive !== undefined) doctor.isActive = isActive;
  
  await hospital.save();
  
  res.json({
    success: true,
    message: "Doctor updated successfully",
    data: { doctor }
  });
}));

// Remove doctor from hospital
router.delete("/me/doctors/:doctorId", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  const doctor = hospital.doctors.id(req.params.doctorId);
  if (!doctor) {
    throw new NotFoundError("Doctor");
  }
  
  hospital.doctors.pull(req.params.doctorId);
  await hospital.save();
  
  res.json({
    success: true,
    message: "Doctor removed successfully"
  });
}));

// Get all doctors in hospital
router.get("/me/doctors", protectHospital, requireRole("hospital"), catchAsync(async (req, res) => {
  const hospital = await Hospital.findById(req.hospital._id);
  if (!hospital) {
    throw new NotFoundError("Hospital");
  }
  
  res.json({
    success: true,
    data: {
      doctors: hospital.doctors,
      count: hospital.doctors.length
    }
  });
}));

export default router;

