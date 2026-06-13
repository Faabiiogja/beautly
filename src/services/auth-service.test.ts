import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticate, LoginRateLimitError } from "./auth-service";

beforeEach(async () => {
  await resetDb();
});

describe("authenticate", () => {
  it("returns the session payload for valid credentials", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });

    const result = await authenticate("admin@beautly.com", "senha123");
    expect(result).toMatchObject({ role: "PLATFORM_ADMIN", businessId: null });
    expect(result?.userId).toBeDefined();
  });

  it("returns null for wrong password", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });
    expect(await authenticate("admin@beautly.com", "errada")).toBeNull();
  });

  it("returns null for unknown email", async () => {
    expect(await authenticate("nao@existe.com", "x")).toBeNull();
  });

  it("locks the email after repeated failures, even with the right password", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });
    for (let i = 0; i < 5; i++) {
      await authenticate("admin@beautly.com", "errada");
    }
    await expect(
      authenticate("admin@beautly.com", "senha123"),
    ).rejects.toBeInstanceOf(LoginRateLimitError);
  });

  it("resets the failure count after a successful login", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });
    for (let i = 0; i < 4; i++) {
      await authenticate("admin@beautly.com", "errada");
    }
    expect(await authenticate("admin@beautly.com", "senha123")).not.toBeNull();
    expect(await authenticate("admin@beautly.com", "senha123")).not.toBeNull();
  });
});
