import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  role: "PLATFORM_ADMIN" | "PROFESSIONAL";
  businessId: string | null;
}

const options: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "beautly_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, options);
}
