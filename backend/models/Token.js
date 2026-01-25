const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    tokenNumber: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    // parentName ko bilkul optional rakha hai
    parentName: { type: String, trim: false, default: "" }, 
    phone: { type: String, required: true },
    residence: { type: String, required: true },
    issue: { type: String, required: true },
    date: { type: String, required: true, index: true }, 
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'cancelled'], 
        default: 'pending' 
    }
}, { timestamps: true });

// Text index sirf 'name' par rakhein, kabhi kabhi multi-index crash karta hai
tokenSchema.index({ name: 'text' });

module.exports = mongoose.model('Token', tokenSchema);