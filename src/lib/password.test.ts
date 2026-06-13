import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("segredo123");
    expect(await verifyPassword("segredo123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("segredo123");
    expect(await verifyPassword("errado", hash)).toBe(false);
  });
});
