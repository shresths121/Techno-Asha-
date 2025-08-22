import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },

    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital",   // ✅ Link doctor to hospital
      required: true 
    },

    specialty: { 
      type: String, 
      required: true 
    },

    city: { 
      type: String, 
      required: true 
    },

    experience: { 
      type: Number, 
      default: 0 
    },

    // ✅ Patients assigned to this doctor
    patients: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Patient" }
    ],

    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// ✅ Indexes for performance
doctorSchema.index({ user: 1 }); 
doctorSchema.index({ hospital: 1 }); // New index for hospital queries
doctorSchema.index({ specialty: 1 }); 
doctorSchema.index({ city: 1 }); 
doctorSchema.index({ specialty: 1, city: 1 }); 
doctorSchema.index({ patients: 1 }); 
doctorSchema.index({ experience: 1 }); 

export default mongoose.model("Doctor", doctorSchema);
