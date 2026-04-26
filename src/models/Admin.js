import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, required: true, enum: ['staff', 'admin', 'superadmin'], default: 'staff' },
  name: { type: String, required: true },
  loginAttempts: { type: Number, default: 0 },
  lockUntil: { type: Number },
  lastLogin: { type: Date }
}, { timestamps: true });

// IS WALA HISSE KO DHYAN SE DEKHEIN - 'next' nikal diya hai
AdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    // Yahan next() nahi likhna, async function khud handle kar leta hai
  } catch (error) {
    throw error; 
  }
});

AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.models.Admin || mongoose.model('Admin', AdminSchema, 'admins');