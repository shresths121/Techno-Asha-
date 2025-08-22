import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import { catchAsync, ValidationError, ConflictError, AuthenticationError } from "../middleware/errorHandler.js";

const router = express.Router();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ _id: userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Helper function to validate hospital registration
const validateHospitalRegistration = (data) => {
  const { name, address, city, state, email, phone, emergencyPhone } = data;
  
  if (!name || !address || !city || !state || !email) {
    throw new ValidationError("All required fields must be provided");
  }
  
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError("Invalid email format");
  }
  
  if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
    throw new ValidationError("Invalid phone number format");
  }
  
  if (emergencyPhone && !/^\+?[\d\s\-\(\)]+$/.test(emergencyPhone)) {
    throw new ValidationError("Invalid emergency phone number format");
  }
};

// Patient Registration
router.post("/patient/register", catchAsync(async (req, res) => {
  const { name, email, password, age, gender, address, city, state } = req.body;

  if (!name || !email || !password) {
    throw new ValidationError("Name, email, and password are required");
  }

  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role: "patient"
  });
  await user.save();

  // Create patient profile
  const patient = new Patient({
    user: user._id,
    age,
    gender,
    location: { address, city, state }
  });
  await patient.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Patient registered successfully",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// Doctor Registration
router.post("/doctor/register", catchAsync(async (req, res) => {
  const { name, email, password, specialty, city, experience } = req.body;

  if (!name || !email || !password || !specialty) {
    throw new ValidationError("Name, email, password, and specialty are required");
  }

  if (password.length < 6) {
    throw new ValidationError("Password must be at least 6 characters long");
  }

  const validSpecialties = ["Cardiologist", "General Physician", "Dermatologist", "Dentist", "Ophthalmologist", "Orthopedic", "Psychiatrist"];
  if (!validSpecialties.includes(specialty)) {
    throw new ValidationError("Invalid specialty");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError("User with this email already exists");
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = new User({
    name,
    email,
    password: hashedPassword,
    role: "doctor"
  });
  await user.save();

  // Create doctor profile
  const doctor = new Doctor({
    user: user._id,
    specialty,
    city,
    experience
  });
  await doctor.save();

  // Generate token
  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    message: "Doctor registered successfully",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// Hospital Registration
router.post("/hospital/register", catchAsync(async (req, res) => {
  const { name, address, city, state, email, phone, emergencyPhone, specialties, password } = req.body;

  validateHospitalRegistration({ name, address, city, state, email, phone, emergencyPhone });

  if (!password || password.length < 6) {
    throw new ValidationError("Password is required and must be at least 6 characters long");
  }

  // Check if hospital already exists
  const existingHospital = await Hospital.findOne({ email });
  if (existingHospital) {
    throw new ConflictError("Hospital with this email already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create hospital
  const hospital = new Hospital({
    name,
    address,
    city,
    state,
    email,
    phone,
    emergencyPhone,
    password: hashedPassword,
    specialties: specialties || []
  });
  await hospital.save();

  res.status(201).json({
    success: true,
    message: "Hospital registered successfully",
    data: {
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        city: hospital.city
      }
    }
  });
}));

// Patient Login
router.post("/patient/login", catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // Find user
  const user = await User.findOne({ email, role: "patient" });
  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Generate token
  const token = generateToken(user._id);

    res.json({
    success: true,
      message: "Login successful",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// Doctor Login
router.post("/doctor/login", catchAsync(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // Find user
  const user = await User.findOne({ email, role: "doctor" });
  if (!user) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new AuthenticationError("Invalid credentials");
  }

  // Generate token
  const token = generateToken(user._id);

    res.json({
    success: true,
    message: "Login successful",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    }
  });
}));

// Hospital Login
router.post("/hospital/login", catchAsync(async (req, res) => {
    const { email, password } = req.body;
    
    if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  // Find hospital
  const hospital = await Hospital.findOne({ email, isActive: true });
  if (!hospital) {
    throw new AuthenticationError("Hospital not found or inactive");
  }

  // Check password (if hospital has password field)
  if (hospital.password) {
    const isPasswordValid = await bcrypt.compare(password, hospital.password);
    if (!isPasswordValid) {
      throw new AuthenticationError("Invalid credentials");
    }
  } else {
    // For existing hospitals without password, check if password matches a default or stored value
    // This is a temporary solution - in production, all hospitals should have passwords
    if (password !== 'hospital123') { // Default password for existing hospitals
      throw new AuthenticationError("Invalid credentials");
    }
  }

    res.json({
    success: true,
      message: "Login successful",
    data: {
      hospital: {
        _id: hospital._id,
        name: hospital.name,
        email: hospital.email,
        city: hospital.city
      }
    }
  });
}));

export default router;
