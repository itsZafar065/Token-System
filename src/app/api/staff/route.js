import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Admin from "@/models/Admin"; 
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

async function getAuthRole() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.role;
  } catch (err) { return null; }
}

export async function GET() {
  try {
    await dbConnect();
    const staff = await Admin.find({ role: { $ne: "superadmin" } }).select("-password");
    return NextResponse.json({ success: true, data: staff });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const role = await getAuthRole();
    if (role !== "superadmin") return NextResponse.json({ success: false, message: "Denied!" }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const usernameFixed = body.username.trim().toLowerCase();
    const existing = await Admin.findOne({ username: usernameFixed });
    
    if (existing) return NextResponse.json({ success: false, message: "Username exists!" }, { status: 400 });

    await Admin.create({ ...body, username: usernameFixed });
    return NextResponse.json({ success: true, message: "Staff added!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

// --- NEW UPDATE (PATCH) METHOD ---
export async function PATCH(req) {
  try {
    const role = await getAuthRole();
    if (role !== "superadmin") return NextResponse.json({ success: false, message: "Denied!" }, { status: 403 });

    await dbConnect();
    const body = await req.json();
    const { id, ...updateData } = body;

    const user = await Admin.findById(id);
    if (!user) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    // Update fields
    if (updateData.name) user.name = updateData.name;
    if (updateData.role) user.role = updateData.role;
    if (updateData.password && updateData.password !== "") {
        user.password = updateData.password; // Model pre-save hash karega
    }

    await user.save();
    return NextResponse.json({ success: true, message: "Updated successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}

export async function DELETE(req) {
  try {
    const role = await getAuthRole();
    if (role !== "superadmin") return NextResponse.json({ success: false, message: "Denied!" }, { status: 403 });
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    await Admin.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}