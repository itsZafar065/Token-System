import mongoose from 'mongoose';

const ScheduleSchema = new mongoose.Schema({
  openTime: { type: String, default: "09:00" },
  closeTime: { type: String, default: "17:00" },
  activeDays: { type: [String], default: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  // Naye Fields
  officeLat: { type: Number, default: 24.95255292235095 },
  officeLng: { type: Number, default: 66.95495653496704 },
  radius: { type: Number, default: 500 }, // Meters mein
  // Toggle Field (On/Off Button ke liye)
  isLocationEnabled: { type: Boolean, default: true } 
}, { timestamps: true });

export default mongoose.models.Schedule || mongoose.model('Schedule', ScheduleSchema);