import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";
import { sessionSecret } from "@/lib/session-secret";

export interface ClientSessionData {
  businessId?: string;
  phone?: string;
}

function options(): SessionOptions {
  return {
    password: sessionSecret(),
    cookieName: "beautly_client",
    cookieOptions: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 30,
    },
  };
}

export async function getClientSession() {
  const cookieStore = await cookies();
  return getIronSession<ClientSessionData>(cookieStore, options());
}

/** Telefone verificado para ESTE negocio? (isolamento 18.3) */
export async function verifiedPhoneFor(businessId: string): Promise<string | null> {
  const session = await getClientSession();
  if (session.businessId === businessId && session.phone) return session.phone;
  return null;
}
