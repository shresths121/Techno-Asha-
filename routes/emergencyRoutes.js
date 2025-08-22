import express from "express";
import Emergency from "../models/Emergency.js";
import Hospital from "../models/Hospital.js";
import { catchAsync, ValidationError, NotFoundError, ConflictError } from "../middleware/errorHandler.js";

const router = express.Router();

// Create emergency SOS request
router.post("/sos", catchAsync(async (req, res) => {
  const {
    patientId,
    latitude,
    longitude,
    address,
    description,
    severity
  } = req.body;
  
  if (!patientId || !latitude || !longitude) {
    throw new ValidationError("Patient ID, latitude, and longitude are required");
  }
  
  // Check if patient already has an active emergency
  const existingEmergency = await Emergency.findOne({
    patient: patientId,
    status: { $in: ["Active", "Accepted"] }
  });
  
  if (existingEmergency) {
    throw new ConflictError("Patient already has an active emergency request");
  }
  
  // Find nearby hospitals
  const nearbyHospitals = await Hospital.find({
    isActive: true,
    emergencyServices: true,
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [longitude, latitude]
        },
        $maxDistance: 50 * 1000 // 50km radius
      }
    }
  }).limit(10);
  
  // Create emergency request
  const emergency = await Emergency.create({
    patient: patientId,
    patientLocation: {
      latitude,
      longitude,
      address
    },
    description,
    severity: severity || "Medium",
    nearbyHospitals: nearbyHospitals.map(hospital => ({
      hospital: hospital._id,
      distance: calculateDistance(latitude, longitude, hospital.coordinates.latitude, hospital.coordinates.longitude)
    }))
  });
  
  res.status(201).json({
    success: true,
    message: "Emergency SOS sent successfully",
    data: {
      emergency,
      nearbyHospitals: nearbyHospitals.length
    }
  });
}));

// Get emergency by ID
router.get("/:id", catchAsync(async (req, res) => {
  const emergency = await Emergency.findById(req.params.id)
    .populate("patient", "user")
    .populate("acceptedBy.hospital")
    .populate("nearbyHospitals.hospital");
  
  if (!emergency) {
    throw new NotFoundError("Emergency");
  }
  
  res.json({
    success: true,
    data: emergency
  });
}));

// Get patient's emergency history
router.get("/patient/:patientId", catchAsync(async (req, res) => {
  const emergencies = await Emergency.find({ patient: req.params.patientId })
    .populate("acceptedBy.hospital")
    .sort({ createdAt: -1 });
  
  res.json({
    success: true,
    data: emergencies
  });
}));

// Hospital accepts emergency request
router.patch("/:id/accept", catchAsync(async (req, res) => {
  const { hospitalId } = req.body;
  
  if (!hospitalId) {
    throw new ValidationError("Hospital ID is required");
  }
  
  const emergency = await Emergency.findById(req.params.id);
  
  if (!emergency) {
    throw new NotFoundError("Emergency");
  }
  
  if (emergency.status !== "Active") {
    throw new ConflictError("Emergency request is no longer active");
  }
  
  // Check if hospital is in nearby hospitals list
  const isNearby = emergency.nearbyHospitals.some(
    nh => nh.hospital.toString() === hospitalId
  );
  
  if (!isNearby) {
    throw new ConflictError("Hospital is not in the nearby hospitals list");
  }
  
  emergency.status = "Accepted";
  emergency.acceptedBy = {
    hospital: hospitalId,
    acceptedAt: new Date()
  };
  
  await emergency.save();
  
  res.json({
    success: true,
    message: "Emergency request accepted successfully",
    data: emergency
  });
}));

// Complete emergency request
router.patch("/:id/complete", catchAsync(async (req, res) => {
  const emergency = await Emergency.findById(req.params.id);
  
  if (!emergency) {
    throw new NotFoundError("Emergency");
  }
  
  if (emergency.status !== "Accepted") {
    throw new ConflictError("Emergency request must be accepted before completion");
  }
  
  emergency.status = "Completed";
  await emergency.save();
  
  res.json({
    success: true,
    message: "Emergency request completed successfully",
    data: emergency
  });
}));

// Cancel emergency request
router.patch("/:id/cancel", catchAsync(async (req, res) => {
  const emergency = await Emergency.findById(req.params.id);
  
  if (!emergency) {
    throw new NotFoundError("Emergency");
  }
  
  if (emergency.status === "Completed") {
    throw new ConflictError("Cannot cancel completed emergency request");
  }
  
  emergency.status = "Cancelled";
  await emergency.save();
  
  res.json({
    success: true,
    message: "Emergency request cancelled successfully",
    data: emergency
  });
}));

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default router;

