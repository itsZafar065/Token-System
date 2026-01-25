const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
    // Field ka naam 'days' rakha hai taake frontend se match kare
    days: {
        type: Map,
        of: new mongoose.Schema({
            start: String,
            end: String,
            isOpen: Boolean
        }, { _id: false })
    }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);