import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a name"],
    trim: true,
    minlength: [2, "Name must be at least 2 characters long"]
  },
  email: {
    type: String,
    required: [true, "Please provide an email"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please provide a valid email"]
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  role: {
    type: String,
    enum: ["patient", "doctor", "admin"],
    default: "patient"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ email: 1, role: 1 }); // Compound index for login queries

export default mongoose.model("User", userSchema);
