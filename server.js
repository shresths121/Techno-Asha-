import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import rateLimit from "express-rate-limit";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

// ✅ Load environment variables
dotenv.config();

// Debugging: confirm if MONGO_URI is found
console.log("👉 MONGO_URI loaded:", process.env.MONGO_URI ? "✅ Found" : "❌ Missing");

// ✅ Import routes
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import issueRoutes from "./routes/issueRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import hospitalRoutes from "./routes/hospitalRoutes.js";
import hospitalDoctorRoutes from "./routes/hospitalDoctorRoutes.js";
import hospitalAppointmentRoutes from "./routes/hospitalAppointmentRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";

// ✅ Import error handlers
import { globalErrorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// ✅ Path setup for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ✅ Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests
});
app.use(limiter);

// ✅ General middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Serve uploads folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/issues", issueRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/hospital-doctors", hospitalDoctorRoutes);
app.use("/api/hospital-appointments", hospitalAppointmentRoutes);
app.use("/api/emergency", emergencyRoutes);

// ✅ Serve frontend (hackathon folder)
app.use(express.static(path.join(__dirname, "hackathon")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "hackathon", "index.html"));
});

// ✅ Error handling
app.use(notFoundHandler);
app.use(globalErrorHandler);

// ✅ MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    dbName: "meditrust", // ensures it connects to correct DB
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
