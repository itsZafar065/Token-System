// src/scripts/seedAdmin.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Note: Is file ko run karne ke liye humein thori tabdeeli karni par sakti hai
// Lekin filhal aap sirf code save kar len.

dotenv.config({ path: '.env.local' });

const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'superadmin' }
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Database Connected!");

    const adminExists = await Admin.findOne({ username: 'superadmin' });
    if (!adminExists) {
      await Admin.create({
        username: 'superadmin',
        password: process.env.SUPER_ADMIN_PASSWORD, // .env se uthayega
        role: 'superadmin'
      });
      console.log("Super Admin Created Successfully!");
    } else {
      console.log("Super Admin already exists.");
    }
    process.exit();
  } catch (error) {
    console.error("Error seeding admin:", error);
    process.exit(1);
  }
}

seed();