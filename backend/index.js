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

// Models (Make sure these paths are correct)
const Token = require('./models/Token');
const Schedule = require('./models/Schedule');

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PATCH", "DELETE"] }
});

app.use(cors());
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
    // Add user to tracking list
    activeUsers.push({ id: socket.id, device: socket.handshake.headers['user-agent'] });
    io.emit('active-users-update', activeUsers);

    console.log('✅ Connection Established:', socket.id);

    // Call Token for Public Dashboard
    socket.on('call-token-ui', (data) => {
        io.emit('token-called', data); // Frontend 'token-called' listen kar raha hai
    });

    socket.on('admin-updated-schedule', (newSchedule) => {
        socket.broadcast.emit('schedule-updated', newSchedule);
    });

    socket.on('disconnect', () => {
        activeUsers = activeUsers.filter(u => u.id !== socket.id);
        io.emit('active-users-update', activeUsers);
        console.log('❌ User disconnected');
    });
});

// --- ADMIN LOGIN ROUTE ---
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;

    const isValidAdmin = (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASS);
    const isValidSuper = (username === process.env.SUPER_ADMIN_USER && password === process.env.SUPER_ADMIN_PASS);

    if (isValidAdmin || isValidSuper) {
        const role = isValidSuper ? 'superadmin' : 'admin';
        const token = jwt.sign({ username, role }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ success: true, token, role });
    }

    res.status(401).json({ success: false, message: "Ghalat credentials!" });
});

// --- ROUTES ---
const tokenRoutes = require('./routes/tokenRoutes');
app.use('/api/tokens', tokenRoutes); // Is file ke andar status update aur delete ke routes hone chahiyen

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

// Deployment logic
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend/dist')));
    app.get(/path*/, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });
}

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected Successfully!"))
    .catch((err) => console.log("❌ DB Error: ", err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server is active on port ${PORT}`);
});