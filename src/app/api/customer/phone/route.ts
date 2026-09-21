import { NextResponse } from "next/server";
import { getSession, signToken, TOKEN_COOKIE_NAME, PERMANENT_COOKIE_MAX_AGE } from "@/lib/auth";
import { dbService, normalizeJordanPhone } from "@/lib/db";

// Strict Jordanian Mobile Regex: Exactly 10 digits starting with 077, 078, or 079
const JORDAN_PHONE_REGEX = /^07[789]\d{7}$/;

export async function POST(req: Request) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== "customer") {
      return NextResponse.json(
        { error: "Customer authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const rawPhone = body.phone;

    if (!rawPhone || typeof rawPhone !== "string") {
      return NextResponse.json(
        { error: "Phone number is required." },
        { status: 400 }
      );
    }

    // Sanitize and normalize Jordanian mobile format
    const cleanedPhone = normalizeJordanPhone(rawPhone.trim());

    // Validate with strict Jordanian mobile number regex
    if (!JORDAN_PHONE_REGEX.test(cleanedPhone)) {
      return NextResponse.json(
        {
          error:
            "Invalid Jordanian phone number. Must be 10 digits starting with 079, 078, or 077 (e.g., 0791234567).",
        },
        { status: 400 }
      );
    }

    // Check if phone number is already registered to another customer
    const existingUser = await dbService.findUserByPhone(cleanedPhone);
    if (existingUser && existingUser._id.toString() !== session.userId.toString()) {
      return NextResponse.json(
        { error: "This phone number is already registered to another account." },
        { status: 409 }
      );
    }

    // Update customer phone in database
    const updatedUser = await dbService.updateUser(session.userId, {
      phone: cleanedPhone,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: "Customer profile not found." },
        { status: 404 }
      );
    }

    // Generate fresh 10-year persistent token with updated phone
    const token = signToken({
      userId: updatedUser._id,
      role: "customer",
      name: updatedUser.name,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatarUrl: updatedUser.avatarUrl,
      googleId: updatedUser.googleId,
      tier: updatedUser.tier,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        tier: updatedUser.tier,
        pointsBalance: updatedUser.pointsBalance,
        lifetimePoints: updatedUser.lifetimePoints,
      },
      token,
    });

    // Set permanent 10-year HTTP-only cookie
    response.cookies.set({
      name: TOKEN_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: PERMANENT_COOKIE_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Phone onboarding API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update phone number." },
      { status: 500 }
    );
  }
}
