import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Patient from "../models/Patient.js";
import Doctor from "../models/Doctor.js";
import Hospital from "../models/Hospital.js";
import { AuthenticationError, AuthorizationError } from "./errorHandler.js";

// Protect routes - verify JWT token
export const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      throw new AuthenticationError("Not authorized, no token");
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user based on token
    const user = await User.findById(decoded._id);
    if (!user) {
      throw new AuthenticationError("Not authorized, user not found");
    }
    
    // Attach user info to request
    req.user = user;
    
    // If it's a patient, attach patient data
    if (user.role === 'patient') {
      const patient = await Patient.findOne({ user: user._id });
      if (patient) {
        req.patient = patient;
      }
    }
    
    // If it's a doctor, attach doctor data
    if (user.role === 'doctor') {
      const doctor = await Doctor.findOne({ user: user._id });
      if (doctor) {
        req.doctor = doctor;
      }
    }
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError("Not authorized, invalid token"));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError("Not authorized, token expired"));
    } else {
      next(error);
    }
  }
};

// Hospital authentication middleware
export const protectHospital = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new AuthenticationError("Email is required for hospital authentication");
    }
    
    // Find hospital by email
    const hospital = await Hospital.findOne({ email, isActive: true });
    if (!hospital) {
      throw new AuthenticationError("Hospital not found or inactive");
    }
    
    // Attach hospital info to request
    req.hospital = hospital;
    next();
  } catch (error) {
    next(error);
  }
};

// Require specific role
export const requireRole = (role) => {
  return (req, res, next) => {
    if (role === 'hospital') {
      // For hospital routes, check if hospital data is attached
      if (!req.hospital) {
        return next(new AuthenticationError("Hospital authentication required"));
      }
      return next();
    }
    
    // For patient/doctor routes, check user role
    if (!req.user) {
      return next(new AuthenticationError("User authentication required"));
    }
    
    if (req.user.role !== role) {
      return next(new AuthorizationError(`Access denied. ${role} role required`));
    }
    
    next();
  };
};

// Optional authentication - doesn't fail if no token
export const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded._id);
      if (user) {
        req.user = user;
        
        if (user.role === 'patient') {
          const patient = await Patient.findOne({ user: user._id });
          if (patient) req.patient = patient;
        } else if (user.role === 'doctor') {
          const doctor = await Doctor.findOne({ user: user._id });
          if (doctor) req.doctor = doctor;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
