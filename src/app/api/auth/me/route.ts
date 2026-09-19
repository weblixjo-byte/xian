import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { dbService } from "@/lib/db";

import { signToken, getCookieOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const user = await dbService.findUserById(session.userId);
    const config = await dbService.getConfig();

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
    }

    const token = signToken({
      userId: user._id,
      role: user.role,
      name: user.name,
      phone: user.phone,
      username: user.username,
      branchName: user.branchName,
      email: user.email,
    });

    const response = NextResponse.json({
      authenticated: true,
      token,
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        phone: user.phone,
        pin: user.pin,
        tier: user.tier,
        pointsBalance: user.pointsBalance,
        lifetimePoints: user.lifetimePoints,
        username: user.username,
        branchName: user.branchName,
        email: user.email,
      },
      config,
    });

    response.cookies.set({
      ...getCookieOptions(req),
      value: token,
    });
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
