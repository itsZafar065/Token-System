import dbConnect from '@/lib/mongodb';
import Token from '@/models/Token';
import { NextResponse } from 'next/server';
import Pusher from 'pusher';

// Pusher Instance (Server Side)
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export async function PATCH(req, { params }) {
  try {
    await dbConnect();

    const { id } = await params; 
    const { status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Data missing" }, { status: 400 });
    }

    // 1. Update Token in MongoDB
    const updatedToken = await Token.findByIdAndUpdate(
      id,
      { status: status },
      { new: true, runValidators: true }
    );

    if (!updatedToken) {
      return NextResponse.json({ success: false, error: "Token not found" }, { status: 404 });
    }

    // 2. ⚡ REAL-TIME SYNC
    // Hum pura object bhej rahe hain taake TV Display ko dobara API call na karni paray
    try {
      await pusher.trigger('token-channel', 'token-updated', {
        id: updatedToken._id,
        tokenNumber: updatedToken.tokenNumber,
        name: updatedToken.name,
        status: updatedToken.status,
        updatedAt: updatedToken.updatedAt
      });
    } catch (pushError) {
      console.error("Pusher Sync Failed:", pushError);
    }

    return NextResponse.json({ success: true, data: updatedToken });

  } catch (error) {
    console.error("Update Logic Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const token = await Token.findById(id);
    
    if (!token) return NextResponse.json({ success: false }, { status: 404 });
    
    return NextResponse.json({ success: true, data: token });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}