import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import { authenticate } from "./auth-service";

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
});
