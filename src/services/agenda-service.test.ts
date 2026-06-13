import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { beforeEach, describe, expect, it } from "vitest";
import {
  cancelByProfessional,
  closeDay,
  isDayClosed,
  listAppointmentsByDay,
  reopenDay,
} from "./agenda-service";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
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
    durationMinutes: 40,
  });
  serviceId = service.id;
});

async function makeAppointment(startIso: string) {
  return prisma.appointment.create({
    data: {
      businessId,
      serviceId,
      customerName: "Cliente",
      customerPhone: "11999999999",
      startAt: new Date(startIso),
      endAt: new Date(startIso),
      serviceNameSnapshot: "Manicure",
      priceSnapshot: 30,
      durationSnapshot: 40,
    },
  });
}

describe("listAppointmentsByDay", () => {
  it("returns only confirmed appointments within the local day", async () => {
    await makeAppointment("2026-06-15T12:00:00.000Z");
    await makeAppointment("2026-06-16T12:00:00.000Z");
    const list = await listAppointmentsByDay(
      businessId,
      "2026-06-15",
      "America/Sao_Paulo",
    );
    expect(list).toHaveLength(1);
  });
});

describe("closeDay / reopenDay", () => {
  it("marks a day closed and reopens it without touching appointments", async () => {
    const appointment = await makeAppointment("2026-06-15T12:00:00.000Z");
    await closeDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(true);

    const still = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(still.status).toBe("CONFIRMED");

    await reopenDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(false);
  });

  it("closing twice is idempotent", async () => {
    await closeDay(businessId, "2026-06-15");
    await closeDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(true);
  });
});

describe("cancelByProfessional", () => {
  it("sets status to CANCELED_BY_PROFESSIONAL", async () => {
    const appointment = await makeAppointment("2026-06-15T12:00:00.000Z");
    await cancelByProfessional(businessId, appointment.id);
    const updated = await prisma.appointment.findUniqueOrThrow({
      where: { id: appointment.id },
    });
    expect(updated.status).toBe("CANCELED_BY_PROFESSIONAL");
  });
});
