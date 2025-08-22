import express from "express";
import multer from "multer";
import path from "path";
import { analyzeDocument } from "../ai/documentAnalyzer.js";
import Patient from "../models/Patient.js";
import { protect, requireRole } from "../middleware/authMiddleware.js";
import { catchAsync, ValidationError, NotFoundError } from "../middleware/errorHandler.js";

const router = express.Router();

// File validation middleware
const fileFilter = (req, file, cb) => {
  // Allow only specific file types
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only JPEG, PNG, GIF, and PDF files are allowed.'), false);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    // Sanitize filename and add timestamp
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + "_" + sanitizedName);
  },
});

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  }
});

/** Patient uploads a report (uses token to find their Patient profile) */
router.post("/upload", protect, requireRole("patient"), upload.single("report"), catchAsync(async (req, res) => {
  if (!req.file) {
    throw new ValidationError("No file uploaded");
  }

  const patient = await Patient.findOne({ user: req.user._id });
  if (!patient) {
    throw new NotFoundError("Patient profile");
  }

  const analysis = await analyzeDocument(req.file.path);
  patient.reports.push({ 
    filePath: req.file.path, 
    analysis,
    uploadedAt: new Date()
  });
  await patient.save();

  res.status(201).json({
    success: true,
    message: "Report uploaded successfully",
    data: {
      analysis, 
      file: `/uploads/${path.basename(req.file.path)}`
    }
  });
}));

/** Get a patient's reports by patient id */
router.get("/patient/:id/reports", protect, catchAsync(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) {
    throw new NotFoundError("Patient");
  }
  
  res.json({
    success: true,
    data: {
      reports: patient.reports.map(r => ({
        uploadedAt: r.uploadedAt,
        analysis: r.analysis,
        file: r.filePath ? `/uploads/${path.basename(r.filePath)}` : undefined
      }))
    }
  });
}));

export default router;
