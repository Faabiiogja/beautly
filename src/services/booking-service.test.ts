import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelByClient,
  confirmBooking,
  listMyAppointments,
  rescheduleByClient,
  SlotTakenError,
} from "./booking-service";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));
  const result = await createProfessional({
    businessName: "Maria",
    slug: "maria",
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

describe("confirmBooking", () => {
  it("creates a confirmed appointment with snapshots", async () => {
    const appointment = await confirmBooking({
      businessId,
      serviceId,
      customerName: "Joana",
      customerPhone: "11999999999",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(appointment.status).toBe("CONFIRMED");
    expect(appointment.priceSnapshot).toBe(30);
    expect(appointment.durationSnapshot).toBe(60);
    expect(appointment.serviceNameSnapshot).toBe("Manicure");
    expect(appointment.endAt.toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });

  it("rejects a slot outside business hours", async () => {
    // 03:00 local (06:00 UTC) — fora do horário 09:00–18:00
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Joana",
        customerPhone: "111",
        startAt: new Date("2026-06-15T06:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("rejects a slot off the interval grid", async () => {
    // 09:13 local não é múltiplo do slotIntervalMinutes
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Joana",
        customerPhone: "111",
        startAt: new Date("2026-06-15T12:13:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("rejects a slot in the past", async () => {
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Joana",
        customerPhone: "111",
        startAt: new Date("2026-06-12T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("rejects a slot on a closed day", async () => {
    await prisma.dayClosure.create({
      data: { businessId, date: new Date("2026-06-15T00:00:00.000Z") },
    });
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Joana",
        customerPhone: "111",
        startAt: new Date("2026-06-15T12:00:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("rejects an invalid startAt date", async () => {
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Joana",
        customerPhone: "111",
        startAt: new Date("garbage"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });

  it("rejects a slot that overlaps an existing appointment", async () => {
    await confirmBooking({
      businessId,
      serviceId,
      customerName: "Joana",
      customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    await expect(
      confirmBooking({
        businessId,
        serviceId,
        customerName: "Bia",
        customerPhone: "222",
        startAt: new Date("2026-06-15T12:30:00.000Z"),
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });
});

describe("listMyAppointments / cancel", () => {
  it("lists by phone within the business and cancels", async () => {
    const appointment = await confirmBooking({
      businessId,
      serviceId,
      customerName: "Joana",
      customerPhone: "11999999999",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(await listMyAppointments(businessId, "11999999999")).toHaveLength(1);

    await cancelByClient(businessId, "11999999999", appointment.id);
    const updated = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(updated.status).toBe("CANCELED_BY_CLIENT");

    const reuse = await confirmBooking({
      businessId,
      serviceId,
      customerName: "Bia",
      customerPhone: "222",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(reuse.status).toBe("CONFIRMED");
  });

  it("does not cancel an appointment from a different phone", async () => {
    const appointment = await confirmBooking({
      businessId,
      serviceId,
      customerName: "Joana",
      customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    await expect(cancelByClient(businessId, "999", appointment.id)).rejects.toThrow();
  });
});

describe("rescheduleByClient", () => {
  it("marks old RESCHEDULED and creates a new CONFIRMED linked", async () => {
    const old = await confirmBooking({
      businessId,
      serviceId,
      customerName: "Joana",
      customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    const created = await rescheduleByClient(
      businessId,
      "111",
      old.id,
      new Date("2026-06-15T15:00:00.000Z"),
    );
    expect(created.status).toBe("CONFIRMED");
    expect(created.rescheduledFromId).toBe(old.id);
    const oldUpdated = await prisma.appointment.findUniqueOrThrow({
      where: { id: old.id },
    });
    expect(oldUpdated.status).toBe("RESCHEDULED");
  });
});
