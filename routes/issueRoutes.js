import express from "express";
import Doctor from "../models/Doctor.js";
import Patient from "../models/Patient.js";
import { analyzeSymptoms } from "../ai/symptomAnalyzer.js";
import { catchAsync, ValidationError, NotFoundError } from "../middleware/errorHandler.js";

const router = express.Router();

/** POST /api/issues/recommend
 * Body: { "issue": "I have chest pain", "city": "Mumbai", "patientId": "123" }
 */
router.post("/recommend", catchAsync(async (req, res) => {
  const { issue, city, patientId } = req.body;
  
  if (!issue) {
    throw new ValidationError("Please describe your issue.");
  }

  // 1. Analyze symptoms → determine specialty
  const specialty = await analyzeSymptoms(issue);

  // 2. Find matching doctors
  const filter = { specialty };
  if (city) filter.city = city;
  const doctors = await Doctor.find(filter).populate("user", "name email");

  // 3. Attach patient to doctors' "find patients" list
  if (patientId && doctors.length > 0) {
    const patient = await Patient.findById(patientId);
    if (patient) {
      for (const doc of doctors) {
        if (!doc.patients) doc.patients = [];
        // Avoid duplicates (compare ObjectId values safely)
        const exists = doc.patients.some((id) => String(id) === String(patient._id));
        if (!exists) {
          doc.patients.push(patient._id);
          await doc.save();
        }
      }
    }
  }

  // 4. Respond with results
  res.json({
    success: true,
    data: {
      specialty,
      count: doctors.length,
      doctors
    }
  });
}));

export default router;
