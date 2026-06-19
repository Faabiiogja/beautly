import { LOGIN_MAX_FAILURES, LOGIN_WINDOW_MINUTES } from "@/lib/constants";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/lib/password";
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
  // Sempre executa bcrypt.compare (tempo constante) mesmo quando o usuário não
  // existe — compara contra um hash dummy — para impedir enumeração de contas
  // via diferença de tempo de resposta.
  const hashToCheck = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordOk = await verifyPassword(password, hashToCheck);
  if (!user || !passwordOk) {
    await prisma.loginAttempt.create({ data: { email: throttleKey } });
    return null;
  }

  await prisma.loginAttempt.deleteMany({ where: { email: throttleKey } });
  return { userId: user.id, role: user.role, businessId: user.businessId };
}
