import bcrypt from "bcryptjs";

// Cost 12 alinha com a recomendação OWASP 2024+ para bcrypt. Aumentar este
// valor invalida hashes antigos apenas na próxima geração — para migrar hashes
// legados, re-hash no próximo login bem-sucedido.
export const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Hash bcrypt cost-12 de uma string que nunca é senha de ninguém. Usado para
 * manter tempo constante no login mesmo quando o usuário não existe (evita
 * enumeração de contas via timing attack).
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$xOYqaprLccD3fWKD579bKeCr0UHcTv2w71WRs3yqIAtDWRoKYnQeW";
