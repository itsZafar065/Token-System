import mongoose from 'mongoose';

const TokenSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  residence: { type: String, required: true },
  issue: { type: String, required: true },
  tokenNumber: { type: Number, required: true },
  // Nayi field device track karne ke liye
  ipAddress: { type: String }, 
  status: { 
    type: String, 
    enum: ['pending', 'calling', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  calledBy: { type: String },
  completedAt: { type: Date },
  waitTime: { type: Number },
}, { timestamps: true });

// Pehle check karo ke model bana hua hai ya nahi
const Token = mongoose.models.Token || mongoose.model('Token', TokenSchema);

export default Token;