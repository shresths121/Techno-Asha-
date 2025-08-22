import mongoose from "mongoose";

const hospitalDoctorSchema = new mongoose.Schema(
  {
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital", 
      required: true 
    },
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      trim: true, 
      lowercase: true 
    },
    phone: { 
      type: String, 
      trim: true 
    },
    specialty: { 
      type: String, 
      required: true, 
      trim: true 
    },
    experience: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    qualifications: { 
      type: String, 
      trim: true 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    city: { 
      type: String, 
      required: true, 
      trim: true 
    },
    state: { 
      type: String, 
      required: true, 
      trim: true 
    },
    address: { 
      type: String, 
      trim: true 
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],   // [longitude, latitude]
        default: [0, 0]
      }
    }
  },
  { timestamps: true }
);

// Add indexes for better query performance
hospitalDoctorSchema.index({ hospital: 1 }); // For finding doctors by hospital
hospitalDoctorSchema.index({ specialty: 1 }); // For specialty-based queries
hospitalDoctorSchema.index({ city: 1 }); // For city-based queries
hospitalDoctorSchema.index({ state: 1 }); // For state-based queries
hospitalDoctorSchema.index({ specialty: 1, city: 1 }); // Compound index for filtered searches
hospitalDoctorSchema.index({ experience: 1 }); // For experience-based sorting
hospitalDoctorSchema.index({ isActive: 1 }); // For active doctor queries
hospitalDoctorSchema.index({ coordinates: "2dsphere" }); // For geospatial queries

export default mongoose.model("HospitalDoctor", hospitalDoctorSchema);
