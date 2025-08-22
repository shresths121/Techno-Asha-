import mongoose from "mongoose";

const emergencySchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Patient",
    required: [true, "Patient ID is required"]
  },
  patientLocation: {
    latitude: {
      type: Number,
      required: [true, "Patient latitude is required"]
    },
    longitude: {
      type: Number,
      required: [true, "Patient longitude is required"]
    },
    address: {
      type: String,
      trim: true
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Description cannot exceed 500 characters"]
  },
  severity: {
    type: String,
    enum: ["Low", "Medium", "High", "Critical"],
    default: "Medium"
  },
  status: {
    type: String,
    enum: ["Active", "Accepted", "Completed", "Cancelled"],
    default: "Active"
  },
  acceptedBy: {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital"
    },
    acceptedAt: {
      type: Date
    }
  },
  nearbyHospitals: [{
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital"
    },
    distance: Number,
    notifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
emergencySchema.index({ status: 1 });
emergencySchema.index({ patient: 1 });
emergencySchema.index({ "patientLocation.coordinates": "2dsphere" });
emergencySchema.index({ createdAt: -1 });

// Update timestamp on save
emergencySchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const Emergency = mongoose.model("Emergency", emergencySchema);

export default Emergency;

