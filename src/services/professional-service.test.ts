import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import {
  createProfessional,
  listProfessionals,
  setProfessionalStatus,
} from "./professional-service";

beforeEach(async () => {
  await resetDb();
});

describe("createProfessional", () => {
  it("creates business, professional user and 7 weekly-hours rows", async () => {
    const result = await createProfessional({
      businessName: "Maria Nails",
      slug: "maria-nails",
      contactPhone: "11999999999",
      email: "maria@beautly.com",
      password: "senha123",
      startActive: true,
    });

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: result.businessId },
    });
    expect(business.status).toBe("ACTIVE");
    expect(business.slug).toBe("maria-nails");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "maria@beautly.com" },
    });
    expect(user.role).toBe("PROFESSIONAL");
    expect(user.businessId).toBe(result.businessId);
    expect(await verifyPassword("senha123", user.passwordHash)).toBe(true);

    const hours = await prisma.weeklyHours.findMany({
      where: { businessId: result.businessId },
    });
    expect(hours).toHaveLength(7);
    const weekdays = hours.filter((hour) => hour.weekday >= 1 && hour.weekday <= 5);
    expect(weekdays.every((hour) => hour.isOpen)).toBe(true);
  });

  it("can create an inactive professional", async () => {
    const result = await createProfessional({
      businessName: "Ana Lash",
      slug: "ana-lash",
      contactPhone: "11988888888",
      email: "ana@beautly.com",
      password: "senha123",
      startActive: false,
    });
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: result.businessId },
    });
    expect(business.status).toBe("INACTIVE");
  });

  it("rejects a duplicate slug", async () => {
    const data = {
      businessName: "X",
      slug: "dup",
      contactPhone: "1",
      email: "x@x.com",
      password: "senha123",
      startActive: true,
    };
    await createProfessional(data);
    await expect(createProfessional({ ...data, email: "y@y.com" })).rejects.toThrow();
  });
});

describe("setProfessionalStatus / listProfessionals", () => {
  it("toggles status and lists businesses", async () => {
    const { businessId } = await createProfessional({
      businessName: "Maria Nails",
      slug: "maria-nails",
      contactPhone: "11999999999",
      email: "maria@beautly.com",
      password: "senha123",
      startActive: true,
    });

    await setProfessionalStatus(businessId, "INACTIVE");
    const list = await listProfessionals();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("INACTIVE");
  });
});
