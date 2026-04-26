import dbConnect from "@/lib/mongodb";
import { SignJWT } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import Admin from "@/models/Admin";

export async function POST(request) {
  try {
    await dbConnect();
    const { username, password } = await request.json();

    const userLower = username?.trim().toLowerCase();
    
    // Search only in Admin model (which points to 'admins' collection)
    const admin = await Admin.findOne({ username: userLower });

    if (!admin) {
      return NextResponse.json({ success: false, message: "Invalid Credentials" }, { status: 401 });
    }

    // Professional Bcrypt Comparison
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return NextResponse.json({ success: false, message: "Invalid Credentials" }, { status: 401 });
    }

    // Update Last Login
    admin.lastLogin = new Date();
    await admin.save();

    return await createSession(admin.role, admin.name);

  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ success: false, message: "Server Error" }, { status: 500 });
  }
}

async function createSession(role, name) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new SignJWT({ role, name, authorized: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h") // Reduced to 12h for better security
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: true, // Always true for professional apps
    sameSite: "strict", // Changed from lax to strict
    path: "/",
    maxAge: 43200, // 12 hours
  });

  return NextResponse.json({ success: true, role, name });
}