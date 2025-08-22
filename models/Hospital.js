import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
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
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],   // [longitude, latitude]
      default: [0, 0]   // optional → defaults to [0,0]
    }
  },
  phone: {
    type: String,
    trim: true
  },
  emergencyPhone: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  specialties: [{
    type: String,
    trim: true
  }],
  emergencyServices: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // ✅ Instead of embedding, we link doctors
  doctors: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Indexes for performance
hospitalSchema.index({ email: 1 });
hospitalSchema.index({ city: 1 });
hospitalSchema.index({ specialties: 1 });
hospitalSchema.index({ coordinates: "2dsphere" });
hospitalSchema.index({ isActive: 1 });

export default mongoose.model("Hospital", hospitalSchema);
