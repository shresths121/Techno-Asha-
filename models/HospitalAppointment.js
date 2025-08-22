import mongoose from "mongoose";

const hospitalAppointmentSchema = new mongoose.Schema(
  {
    hospitalDoctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "HospitalDoctor", 
      required: true 
    },
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    time: { 
      type: String, 
      required: true 
    },
    notes: { 
      type: String, 
      trim: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "confirmed", "cancelled", "completed"], 
      default: "pending" 
    },
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital", 
      required: true 
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
hospitalAppointmentSchema.index({ hospitalDoctor: 1 }); // For finding appointments by doctor
hospitalAppointmentSchema.index({ patient: 1 }); // For finding appointments by patient
hospitalAppointmentSchema.index({ date: 1 }); // For date-based queries
hospitalAppointmentSchema.index({ status: 1 }); // For status-based queries
hospitalAppointmentSchema.index({ hospital: 1 }); // For hospital-based queries
hospitalAppointmentSchema.index({ hospitalDoctor: 1, date: 1 }); // Compound index for doctor + date
hospitalAppointmentSchema.index({ hospitalDoctor: 1, status: 1 }); // Compound index for doctor + status
hospitalAppointmentSchema.index({ patient: 1, status: 1 }); // Compound index for patient + status

export default mongoose.model("HospitalAppointment", hospitalAppointmentSchema);
