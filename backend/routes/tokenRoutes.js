const express = require('express');
const router = express.Router();
const Token = require('../models/Token');

// --- 1. GET ALL TOKENS ---
router.get('/all', async (req, res) => {
    try {
        const tokens = await Token.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: tokens });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 2. GENERATE TOKEN (Debugged & Fixed) ---
router.post('/generate', async (req, res) => {
    try {
        // Destructuring with fallback for optional fields
        let { name, parentName, phone, residence, issue } = req.body;
        
        // Manual Validation to avoid crash
        if (!name || !phone || !residence || !issue) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // WhatsApp/Phone Formatting
        let formattedPhone = phone.replace(/\D/g, ''); 
        if (formattedPhone.startsWith('0')) {
            formattedPhone = '92' + formattedPhone.substring(1);
        } else if (formattedPhone.length === 10 && formattedPhone.startsWith('3')) {
            formattedPhone = '92' + formattedPhone;
        }

        const today = new Date().toLocaleDateString('en-GB'); 
        
        // Find last token for incremental number
        const lastToken = await Token.findOne({ date: today }).sort({ tokenNumber: -1 });
        const nextNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

        const newToken = new Token({
            name,
            parentName: parentName || "N/A", // If missing, use N/A to satisfy schema
            phone: formattedPhone,
            residence,
            issue,
            tokenNumber: nextNumber,
            date: today,
            status: 'pending'
        });

        const savedToken = await newToken.save();

        // Socket emission
        if (req.io) {
            req.io.emit("new-token", savedToken);
        }

        res.status(201).json({ success: true, data: savedToken });
    } catch (error) {
        // Log exact error in server terminal
        console.error("SERVER ERROR:", error.message);
        res.status(500).json({ success: false, message: "Server Database Error: " + error.message });
    }
});

// --- 3. UPDATE STATUS ---
router.patch('/status/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const updatedToken = await Token.findByIdAndUpdate(
            req.params.id, 
            { status }, 
            { new: true }
        );
        res.status(200).json({ success: true, data: updatedToken });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 4. DAILY REPORT ---
router.get('/report/daily', async (req, res) => {
    try {
        const today = new Date().toLocaleDateString('en-GB');
        const tokens = await Token.find({ date: today });
        const summary = {
            date: today,
            total: tokens.length,
            completed: tokens.filter(t => t.status === 'completed').length,
            pending: tokens.filter(t => t.status === 'pending').length,
            allData: tokens
        };
        res.status(200).json({ success: true, data: summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// --- 5. DELETE ---
router.delete('/:id', async (req, res) => {
    try {
        await Token.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;