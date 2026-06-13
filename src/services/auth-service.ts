import { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES } from "@/lib/constants";
import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { SessionData } from "@/lib/session";
import { findUserByEmail } from "@/repositories/user-repository";

export class LoginRateLimitError extends Error {
  constructor() {
    super("Muitas tentativas. Tente novamente em alguns minutos.");
    this.name = "LoginRateLimitError";
  }
}

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionData | null> {
  const throttleKey = email.trim().toLowerCase();
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);
  const failures = await prisma.loginAttempt.count({
    where: { email: throttleKey, createdAt: { gt: windowStart } },
  });
  if (failures >= LOGIN_MAX_FAILURES) throw new LoginRateLimitError();

  const user = await findUserByEmail(email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await prisma.loginAttempt.create({ data: { email: throttleKey } });
    return null;
  }

  await prisma.loginAttempt.deleteMany({ where: { email: throttleKey } });
  return { userId: user.id, role: user.role, businessId: user.businessId };
}
