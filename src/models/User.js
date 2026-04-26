import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
}, { timestamps: true });

// Check if the model already exists to prevent recompilation error in Next.js
export default mongoose.models.User || mongoose.model("User", UserSchema);