const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// Get Schedule from DB
router.get('/', async (req, res) => {
    try {
        const schedule = await Schedule.findOne();
        res.json({ data: schedule ? schedule.days : null });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

// Update or Create Schedule in DB
router.post('/update', async (req, res) => {
    try {
        let schedule = await Schedule.findOne();
        if (schedule) {
            schedule.days = req.body.schedule;
            await schedule.save();
        } else {
            schedule = new Schedule({ days: req.body.schedule });
            await schedule.save();
        }
        res.json({ message: "Schedule Updated Successfully" });
    } catch (err) { 
        res.status(500).json({ message: err.message }); 
    }
});

module.exports = router;