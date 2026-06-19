import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, validatePassword } from "./password-policy";

describe("validatePassword", () => {
  it("aceita senha no limite mínimo de comprimento", () => {
    expect(validatePassword("a".repeat(MIN_PASSWORD_LENGTH)).ok).toBe(true);
  });

  it("rejeita senha curta", () => {
    const result = validatePassword("abc123");
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/mínimo de 8 caracteres/);
  });

  it("rejeita senha comum numérica", () => {
    expect(validatePassword("12345678").ok).toBe(false);
  });

  it("rejeita senha comum BR", () => {
    expect(validatePassword("senha123").ok).toBe(false);
  });

  it("rejeita senha comum relacionada ao app", () => {
    expect(validatePassword("beautly2026").ok).toBe(false);
  });

  it("é insensível a maiúsculas na blacklist", () => {
    expect(validatePassword("SENHA123").ok).toBe(false);
    expect(validatePassword("Password1").ok).toBe(false);
  });

  it("aceita senha forte", () => {
    expect(validatePassword("cavalo-azul-42!piano").ok).toBe(true);
  });

  it("a mensagem de senha comum não revela o motivo exato", () => {
    const result = validatePassword("12345678");
    expect(result.error).toMatch(/muito comum/);
    expect(result.error).not.toMatch(/12345678/);
  });
});
