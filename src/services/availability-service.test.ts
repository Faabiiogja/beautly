import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { closeDay } from "./agenda-service";
import { availableSlots } from "./availability-service";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));

  const result = await createProfessional({
    businessName: "Maria Nails",
    slug: "maria-nails",
    contactPhone: "1",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = result.businessId;
  const service = await createService(businessId, {
    name: "Manicure",
    price: 30,
    durationMinutes: 60,
  });
  serviceId = service.id;
});

afterEach(() => vi.useRealTimers());

describe("availableSlots", () => {
  it("lists slots for an open weekday", async () => {
    const slots = await availableSlots(businessId, serviceId, "2026-06-15");
    expect(slots[0].startAt.toISOString()).toBe("2026-06-15T12:00:00.000Z");
    expect(slots[0].label).toBe("09:00");
    expect(slots[slots.length - 1].label).toBe("17:00");
  });

  it("returns [] for a closed day", async () => {
    await closeDay(businessId, "2026-06-15");
    expect(await availableSlots(businessId, serviceId, "2026-06-15")).toEqual([]);
  });

  it("returns [] for a Sunday (weekday not open)", async () => {
    expect(await availableSlots(businessId, serviceId, "2026-06-14")).toEqual([]);
  });

  it("excludes slots overlapping a confirmed appointment", async () => {
    await prisma.appointment.create({
      data: {
        businessId,
        serviceId,
        customerName: "C",
        customerPhone: "11",
        startAt: new Date("2026-06-15T12:00:00.000Z"),
        endAt: new Date("2026-06-15T13:00:00.000Z"),
        serviceNameSnapshot: "Manicure",
        priceSnapshot: 30,
        durationSnapshot: 60,
      },
    });
    const labels = (await availableSlots(businessId, serviceId, "2026-06-15")).map(
      (slot) => slot.label,
    );
    expect(labels).not.toContain("09:00");
    expect(labels).not.toContain("09:30");
    expect(labels).toContain("10:00");
  });

  it("returns [] beyond the 15-day window", async () => {
    expect(await availableSlots(businessId, serviceId, "2026-07-04")).toEqual([]);
  });

  it("returns [] when business is inactive", async () => {
    await prisma.business.update({
      where: { id: businessId },
      data: { status: "INACTIVE" },
    });
    expect(await availableSlots(businessId, serviceId, "2026-06-15")).toEqual([]);
  });
});
