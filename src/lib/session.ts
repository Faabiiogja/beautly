import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { sessionSecret } from "@/lib/session-secret";

export interface SessionData {
  userId: string;
  role: "PLATFORM_ADMIN" | "PROFESSIONAL";
  businessId: string | null;
}

function options(): SessionOptions {
  return {
    password: sessionSecret(),
    cookieName: "beautly_session",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
    },
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, options());
}
