import dbConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import { notFound } from 'next/navigation';
import Token from '@/models/Token';
import Schedule from '@/models/Schedule'; 
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// --- Helper: Distance Calculation (Haversine Formula) ---
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; 
}

// --- 1. GET: Dashboard Tokens (Admin/Staff Only) ---
export async function GET() {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('admin_token')?.value;
    
    if (!token) return notFound(); 

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userRole = payload.role; 

    await dbConnect();
    let query = {};
    if (userRole === 'staff') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      query = { createdAt: { $gte: startOfToday } };
    } 

    const tokens = await Token.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: tokens, role: userRole }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error) {
    return notFound();
  }
}

// --- 2. PATCH: Public Timings (Home Page & Dashboard Check) ---
export async function PATCH() {
  try {
    await dbConnect();
    const schedule = await Schedule.findOne({});
    if (!schedule) return NextResponse.json({ success: false }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      isScheduleData: true,
      data: {
        openTime: schedule.openTime || "00:00",
        closeTime: schedule.closeTime || "00:00",
        activeDays: schedule.activeDays || [],
        // Adding location data for dashboard preview
        officeLat: schedule.officeLat || 24.95255292235095,
        officeLng: schedule.officeLng || 66.95495653496704,
        radius: schedule.radius || 500
      } 
    });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

// --- 3. POST: Generate Token (Dynamic Location Check) ---
export async function POST(request) {
  try {
    const body = await request.json();
    const { coords, ...userData } = body; 

    await dbConnect();
    const schedule = await Schedule.findOne({});

    // --- DYNAMIC LOCATION SETTINGS (From Database) ---
    const OFFICE_LAT = schedule?.officeLat || 24.95255292235095; 
    const OFFICE_LNG = schedule?.officeLng || 66.95495653496704;
    const MAX_DISTANCE = schedule?.radius || 500; 

    // Location check logic
    if (!coords || !coords.lat || !coords.lng) {
      return NextResponse.json({ 
        success: false, 
        message: "Location access is required to get a token." 
      }, { status: 400 });
    }

    const distance = getDistance(coords.lat, coords.lng, OFFICE_LAT, OFFICE_LNG);
    
    if (distance > MAX_DISTANCE) {
      return NextResponse.json({ 
        success: false, 
        message: "Aap daftar ki hadood se bahar hain. Token sirf daftar ke andar se liya ja sakta hai." 
      }, { status: 403 });
    }
    
    if (schedule) {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Karachi', hour12: false, weekday: 'short', hour: '2-digit', minute: '2-digit'
      });
      const parts = formatter.formatToParts(now);
      const currentDay = parts.find(p => p.type === 'weekday').value;
      
      const hStr = parts.find(p => p.type === 'hour').value;
      const mStr = parts.find(p => p.type === 'minute').value;
      const currentTimeInMinutes = (parseInt(hStr) * 60) + parseInt(mStr);

      const [startH, startM] = schedule.openTime.split(':').map(Number);
      const [endH, endM] = schedule.closeTime.split(':').map(Number);
      
      if (!schedule.activeDays.includes(currentDay) || currentTimeInMinutes < (startH * 60 + startM) || currentTimeInMinutes > (endH * 60 + endM)) {
        return NextResponse.json({ success: false, message: "System Closed", isClosed: true }, { status: 403 });
      }
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const lastToken = await Token.findOne({ createdAt: { $gte: startOfToday } }).sort({ tokenNumber: -1 });
    const nextNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const newToken = await Token.create({ ...userData, tokenNumber: nextNumber, status: 'pending' });
    return NextResponse.json({ success: true, tokenNumber: newToken.tokenNumber });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Error" }, { status: 500 });
  }
}

// --- 4. PUT: Update Schedule & Location (Admin Dashboard Only) ---
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) return NextResponse.json({ success: false, message: "No Token" }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    if (payload.role !== 'superadmin') {
      return NextResponse.json({ success: false, message: "Permission Denied" }, { status: 403 });
    }

    const body = await request.json();
    await dbConnect();

    const updatedSchedule = await Schedule.findOneAndUpdate(
      {}, 
      { 
        openTime: body.openTime, 
        closeTime: body.closeTime, 
        activeDays: body.activeDays,
        // Saving new location fields
        officeLat: body.officeLat,
        officeLng: body.officeLng,
        radius: body.radius
      }, 
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, data: updatedSchedule });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}