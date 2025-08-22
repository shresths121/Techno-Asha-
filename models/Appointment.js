import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
    notes: String
  },
  { timestamps: true }
);

// Add indexes for better query performance
appointmentSchema.index({ doctor: 1 }); // For finding appointments by doctor
appointmentSchema.index({ patient: 1 }); // For finding appointments by patient
appointmentSchema.index({ date: 1 }); // For date-based queries and sorting
appointmentSchema.index({ status: 1 }); // For status-based filtering
appointmentSchema.index({ doctor: 1, date: 1 }); // Compound index for conflict checking
appointmentSchema.index({ doctor: 1, status: 1 }); // For doctor's appointment filtering
appointmentSchema.index({ patient: 1, status: 1 }); // For patient's appointment filtering

export default mongoose.model("Appointment", appointmentSchema);
