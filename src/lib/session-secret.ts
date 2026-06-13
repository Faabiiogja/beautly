export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET precisa estar definida com no mínimo 32 caracteres.",
    );
  }
  return secret;
}
