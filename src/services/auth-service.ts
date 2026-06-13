import { verifyPassword } from "@/lib/password";
import type { SessionData } from "@/lib/session";
import { findUserByEmail } from "@/repositories/user-repository";

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionData | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { userId: user.id, role: user.role, businessId: user.businessId };
}
