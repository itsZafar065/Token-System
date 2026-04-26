import dbConnect from '@/lib/mongodb';
import { NextResponse } from 'next/server';
import Token from '@/models/Token';
import Schedule from '@/models/Schedule'; 
import { cookies } from 'next/headers';
import { jwtVerify } from 'jose';

// Distance calculate karne ka function (Meters mein)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Result meters mein
}

export async function GET() {
  try {
    const cookieStore = await cookies(); 
    const token = cookieStore.get('admin_token')?.value;
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

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
    return NextResponse.json({ success: true, data: tokens, role: userRole });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await dbConnect();
    const body = await request.json();
    
    // IP Address tracking for device restriction
    const ip = request.headers.get('x-forwarded-for') || '0.0.0.0';

    // --- 1. DUPLICATE CHECK (1 Token Per Day Per Device/IP) ---
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingToken = await Token.findOne({
      ipAddress: ip,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    if (existingToken) {
      return NextResponse.json({ 
        success: false, 
        message: "Limit Reached: Only one token allowed per day." 
      }, { status: 403 });
    }

    // --- 2. GET SCHEDULE & LOCATION FROM DB ---
    const schedule = await Schedule.findOne({});
    
    if (schedule) {
      const now = new Date();
      const options = { timeZone: 'Asia/Karachi', hour12: false };
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        ...options,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const parts = formatter.formatToParts(now);
      const currentDay = parts.find(p => p.type === 'weekday').value;
      const currentH = parseInt(parts.find(p => p.type === 'hour').value);
      const currentM = parseInt(parts.find(p => p.type === 'minute').value);
      const currentTimeInMinutes = (currentH * 60) + currentM;

      const [startH, startM] = schedule.openTime.split(':').map(Number);
      const [endH, endM] = schedule.closeTime.split(':').map(Number);
      const startMinutes = (startH * 60) + startM;
      const endMinutes = (endH * 60) + endM;

      const isDayActive = schedule.activeDays.includes(currentDay);
      const isWithinTime = currentTimeInMinutes >= startMinutes && currentTimeInMinutes <= endMinutes;

      if (!isDayActive || !isWithinTime) {
        return NextResponse.json({ 
          success: false, 
          message: `Closed. Timing: ${schedule.openTime} - ${schedule.closeTime}`,
          isClosed: true 
        }, { status: 403 });
      }

      // --- 3. DYNAMIC LOCATION GUARD LOGIC ---
      // Check if location restriction is enabled by admin
      if (schedule.isLocationEnabled && schedule.officeLat && schedule.officeLng) {
        const { userLat, userLng } = body;

        if (!userLat || !userLng) {
          return NextResponse.json({ 
            success: false, 
            message: "Location Access Required. Please enable GPS." 
          }, { status: 400 });
        }

        const distance = getDistance(
          parseFloat(userLat), 
          parseFloat(userLng), 
          schedule.officeLat, 
          schedule.officeLng
        );

        if (distance > schedule.radius) {
          return NextResponse.json({ 
            success: false, 
            message: "You are too far from the office to generate a token." 
          }, { status: 403 });
        }
      }
    }

    // --- 4. TOKEN GENERATION ---
    const lastToken = await Token.findOne({
      createdAt: { $gte: startOfToday }
    }).sort({ tokenNumber: -1 });

    const nextNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    const newToken = await Token.create({
      ...body,
      ipAddress: ip, 
      tokenNumber: nextNumber,
      status: 'pending'
    });

    return NextResponse.json({ success: true, tokenNumber: newToken.tokenNumber, data: newToken });
  } catch (error) {
    console.error("Token API Error:", error);
    return NextResponse.json({ success: false, error: "System Error" }, { status: 500 });
  }
}