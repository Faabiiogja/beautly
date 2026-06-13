import { redirect } from "next/navigation";
import { getSession, type SessionData } from "@/lib/session";

export async function requirePlatformAdmin(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId || session.role !== "PLATFORM_ADMIN") {
    redirect("/platform/login");
  }
  return session;
}

export async function requireProfessional(): Promise<SessionData> {
  const session = await getSession();
  if (
    !session.userId ||
    session.role !== "PROFESSIONAL" ||
    !session.businessId
  ) {
    redirect("/admin/login");
  }
  return session;
}
