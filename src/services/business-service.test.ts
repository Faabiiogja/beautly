import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import { createProfessional } from "./professional-service";
import {
  getBusiness,
  isBusinessReady,
  updateBusinessProfile,
} from "./business-service";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const result = await createProfessional({
    businessName: "Maria Nails",
    slug: "maria-nails",
    contactPhone: "11999999999",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = result.businessId;
});

describe("updateBusinessProfile", () => {
  it("updates editable fields only", async () => {
    await updateBusinessProfile(businessId, {
      name: "Maria Nails Studio",
      contactPhone: "11000000000",
      defaultMessage: "Chegue 10min antes.",
      slotIntervalMinutes: 60,
    });
    const business = await getBusiness(businessId);
    expect(business.name).toBe("Maria Nails Studio");
    expect(business.slotIntervalMinutes).toBe(60);
    expect(business.defaultMessage).toBe("Chegue 10min antes.");
  });
});

describe("isBusinessReady", () => {
  it("is false without an active service", async () => {
    expect(await isBusinessReady(businessId)).toBe(false);
  });

  it("is true with active business, service and open weekday", async () => {
    await prisma.service.create({
      data: {
        businessId,
        name: "Manicure",
        price: 30,
        durationMinutes: 40,
        active: true,
      },
    });
    expect(await isBusinessReady(businessId)).toBe(true);
  });

  it("is false when business is inactive", async () => {
    await prisma.service.create({
      data: {
        businessId,
        name: "Manicure",
        price: 30,
        durationMinutes: 40,
        active: true,
      },
    });
    await prisma.business.update({
      where: { id: businessId },
      data: { status: "INACTIVE" },
    });
    expect(await isBusinessReady(businessId)).toBe(false);
  });
});
