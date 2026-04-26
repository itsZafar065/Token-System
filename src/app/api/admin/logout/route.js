import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("admin_token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Logged out" });
  } catch (error) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}