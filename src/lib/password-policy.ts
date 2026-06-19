/**
 * Política de senha para criação de profissionais. Avalia comprimento mínimo
 * (ASVS v4) e rejeita senhas trivialmente comuns. Não impõe regras de
 * complexidade arcaicas (maiúscula/símbolo) que só enfraquecem por usabilidade.
 */
export const MIN_PASSWORD_LENGTH = 8;

// Set pequeno e focado em senhas muito óbvias (BR + globais). Para tightening
// futuro, integrar HaveIBeenPwned Passwords API (range search k-anonimato).
const COMMON_PASSWORDS: ReadonlySet<string> = new Set([
  // Numéricas sequenciais
  "12345678", "123456789", "1234567890", "11111111", "00000000",
  "123123123", "01234567", "0123456789",
  // Globais comuns
  "password", "password1", "password12", "passw0rd1",
  "qwerty123", "qwertyui", "abcdefgh", "abcd1234",
  // BR comuns
  "senha123", "senhasenha", "mudar123", "mudame123",
  // Relacionadas ao app
  "beautly123", "beauty123", "beautly2026", "admin123", "admin1234",
]);

export interface PasswordCheck {
  ok: boolean;
  error?: string;
}

export function validatePassword(plain: string): PasswordCheck {
  if (plain.length < MIN_PASSWORD_LENGTH) {
    return {
      ok: false,
      error: `Senha deve ter no mínimo de ${MIN_PASSWORD_LENGTH} caracteres.`,
    };
  }
  if (COMMON_PASSWORDS.has(plain.toLowerCase())) {
    return {
      ok: false,
      error: "Senha muito comum. Escolha uma mais forte.",
    };
  }
  return { ok: true };
}
