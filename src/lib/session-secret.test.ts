import { afterEach, describe, expect, it, vi } from "vitest";
import { sessionSecret } from "./session-secret";

// Segredo forte, não-placeholder, usado apenas para o caminho feliz dos testes.
const VALID_SECRET = "k9f2a7b4c1e8d3f6a0b5c2e9d4f7a1b8c3e6d0f5a2b9c4e7d1f8a3b6c0e5d2f9";

const ENV_PLACEHOLDER = "um-segredo-aleatorio-com-no-minimo-32-chars";
const TEST_PLACEHOLDER = "segredo-de-teste-com-no-minimo-32-caracteres-ok";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sessionSecret - validação de tamanho", () => {
  it("devolve o segredo quando válido e fora da blacklist", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", VALID_SECRET);
    expect(sessionSecret()).toBe(VALID_SECRET);
  });

  it("lança quando SESSION_SECRET não está definida", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "");
    expect(() => sessionSecret()).toThrow(/no mínimo de 32 caracteres/);
  });

  it("lança quando o segredo tem menos de 32 caracteres", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", "curto");
    expect(() => sessionSecret()).toThrow(/no mínimo de 32 caracteres/);
  });
});

describe("sessionSecret - rejeição de placeholders públicos", () => {
  it("rejeita o placeholder do .env.example", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", ENV_PLACEHOLDER);
    expect(() => sessionSecret()).toThrow(/placeholder público/);
  });

  it("rejeita o placeholder do .env.test.example", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", TEST_PLACEHOLDER);
    expect(() => sessionSecret()).toThrow(/placeholder público/);
  });

  it("é insensível a maiúsculas e a espaços nas bordas", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv(
      "SESSION_SECRET",
      `  ${ENV_PLACEHOLDER.toUpperCase()}  `,
    );
    expect(() => sessionSecret()).toThrow(/placeholder público/);
  });

  it("exibe instrução de geração na mensagem de erro", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("SESSION_SECRET", ENV_PLACEHOLDER);
    expect(() => sessionSecret()).toThrow(/openssl rand/);
  });
});

describe("sessionSecret - escape hatch para testes", () => {
  it("aceita o placeholder de teste quando NODE_ENV=test", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SESSION_SECRET", TEST_PLACEHOLDER);
    expect(sessionSecret()).toBe(TEST_PLACEHOLDER);
  });

  it("mesmo em test, ainda exige no mínimo 32 caracteres", () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("SESSION_SECRET", "curto");
    expect(() => sessionSecret()).toThrow(/no mínimo de 32 caracteres/);
  });
});
