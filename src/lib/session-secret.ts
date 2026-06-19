// Valores que aparecem em arquivos .env.example / .env.test.example, que são
// públicos no repositório. Mesmo que passem no mínimo de 32 caracteres, usar
// qualquer um desses em produção permite que um atacante que leu o repo forje
// cookies de sessão iron-session (a assinatura HMAC seria conhecida).
const KNOWN_INSECURE_SECRETS = new Set([
  "um-segredo-aleatorio-com-no-minimo-32-chars", // .env.example
  "segredo-de-teste-com-no-minimo-32-caracteres-ok", // .env.test.example
]);

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET precisa estar definida com no mínimo de 32 caracteres.",
    );
  }
  // Em ambiente de teste o .env.test usa um placeholder fixo de propósito
  // (não há dados reais em jogo); a checagem de placeholder só vale em dev/prod.
  if (process.env.NODE_ENV !== "test" && isKnownInsecure(secret)) {
    throw new Error(
      "SESSION_SECRET está com um valor placeholder público do repositório. " +
        "Gere um segredo real, por exemplo: openssl rand -base64 32",
    );
  }
  return secret;
}

function isKnownInsecure(secret: string): boolean {
  return KNOWN_INSECURE_SECRETS.has(secret.trim().toLowerCase());
}
