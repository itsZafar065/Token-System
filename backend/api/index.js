const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Models
const Token = require('../models/Token');
const Schedule = require('../models/Schedule');

// ========== CORS CONFIGURATION FOR VERCEL ==========
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL || 'https://your-frontend.vercel.app'
];

const io = new Server(server, {
  cors: { 
    origin: allowedOrigins, 
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
  }
});

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// --- JWT SECRET CHECK ---
const JWT_SECRET = process.env.JWT_SECRET || 'spiritual_secret_786';

// --- MIDDLEWARE: Token Verification ---
const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "No Token, Access Denied!" });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Invalid Token!" });
    }
};

// --- LIVE DEVICE TRACKING ---
let activeUsers = [];

io.on('connection', (socket) => {
    activeUsers.push({ id: socket.id, device: socket.handshake.headers['user-agent'] });
    io.emit('active-users-update', activeUsers);

    console.log('✅ Connection Established:', socket.id);

    socket.on('disconnect', () => {
        activeUsers = activeUsers.filter((user) => user.id !== socket.id);
        io.emit('active-users-update', activeUsers);
        console.log('🔌 Disconnected:', socket.id);
    });

    socket.on('update-token', (data) => {
        io.emit('token-updated', data);
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Backend is running!' });
});

// --- ROUTES ---
const tokenRoutes = require('../routes/tokenRoutes');
app.use('/api/tokens', tokenRoutes);

// --- SCHEDULE MANAGEMENT ---
app.post('/api/schedule/update', protect, async (req, res) => {
    try {
        const { schedule } = req.body;
        await Schedule.findOneAndUpdate({}, { days: schedule }, { upsert: true });
        io.emit('schedule-updated', schedule);
        res.json({ success: true, message: "Schedule Updated!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

app.get('/api/schedule', async (req, res) => {
    try {
        const sched = await Schedule.findOne({});
        res.json({ success: true, data: sched ? sched.days : null });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- DATABASE CONNECTION ---
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.log("❌ DB Error: ", err));
}

// ========== VERCEL SERVERLESS EXPORT ==========
// For Vercel Serverless Functions
module.exports = app;
