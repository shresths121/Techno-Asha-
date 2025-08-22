import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  age: {
    type: Number,
    min: [0, "Age cannot be negative"],
    max: [150, "Age cannot exceed 150"]
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"]
  },
  location: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    },
    address: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    }
  },
  emergencyContact: {
    name: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    relationship: {
      type: String,
      trim: true
    }
  },
  reports: [
    {
      filePath: {
        type: String,
        required: true,
        trim: true
      },
      analysis: {
        type: String,
        trim: true
      },
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
patientSchema.index({ user: 1 }); // For finding patient by user ID
patientSchema.index({ age: 1 }); // For age-based queries
patientSchema.index({ gender: 1 }); // For gender-based queries

export default mongoose.model("Patient", patientSchema);
