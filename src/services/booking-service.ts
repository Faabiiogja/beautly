import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";
import { availableSlots } from "./availability-service";

export class SlotTakenError extends Error {
  constructor() {
    super("Horário não está mais disponível.");
    this.name = "SlotTakenError";
  }
}

/**
 * Garante que o horário pedido é um dos slots realmente ofertados
 * (dia aberto, dentro do horário semanal, na grade, futuro, dentro da
 * janela e sem conflito). Impede agendamento com `startAt` forjado.
 */
async function assertSlotOffered(
  businessId: string,
  serviceId: string,
  startAt: Date,
  timezone: string,
) {
  if (Number.isNaN(startAt.getTime())) throw new SlotTakenError();
  const dateStr = formatInTimeZone(startAt, timezone, "yyyy-MM-dd");
  const slots = await availableSlots(businessId, serviceId, dateStr);
  const offered = slots.some(
    (slot) => slot.startAt.getTime() === startAt.getTime(),
  );
  if (!offered) throw new SlotTakenError();
}

type Tx = Prisma.TransactionClient | PrismaClient;

async function assertSlotFree(
  tx: Tx,
  businessId: string,
  startAt: Date,
  endAt: Date,
) {
  const clash = await tx.appointment.findFirst({
    where: {
      businessId,
      status: "CONFIRMED",
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (clash) throw new SlotTakenError();
}

export interface ConfirmInput {
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startAt: Date;
}

export async function confirmBooking(input: ConfirmInput) {
  const businessForTz = await prisma.business.findUnique({
    where: { id: input.businessId },
  });
  if (!businessForTz || businessForTz.status !== "ACTIVE") {
    throw new Error("Negócio indisponível.");
  }
  await assertSlotOffered(
    input.businessId,
    input.serviceId,
    input.startAt,
    businessForTz.timezone,
  );

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: input.businessId },
    });
    if (!business || business.status !== "ACTIVE") {
      throw new Error("Negócio indisponível.");
    }
    const service = await tx.service.findFirst({
      where: { id: input.serviceId, businessId: input.businessId, active: true },
    });
    if (!service) throw new Error("Serviço indisponível.");

    const endAt = new Date(
      input.startAt.getTime() + service.durationMinutes * 60 * 1000,
    );
    await assertSlotFree(tx, input.businessId, input.startAt, endAt);

    return tx.appointment.create({
      data: {
        businessId: input.businessId,
        serviceId: service.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        startAt: input.startAt,
        endAt,
        status: "CONFIRMED",
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationSnapshot: service.durationMinutes,
      },
    });
  });
}

export function listMyAppointments(businessId: string, phone: string) {
  return prisma.appointment.findMany({
    where: { businessId, customerPhone: phone },
    orderBy: { startAt: "desc" },
    include: { service: true },
  });
}

export async function cancelByClient(
  businessId: string,
  phone: string,
  appointmentId: string,
) {
  const result = await prisma.appointment.updateMany({
    where: {
      id: appointmentId,
      businessId,
      customerPhone: phone,
      status: "CONFIRMED",
    },
    data: { status: "CANCELED_BY_CLIENT" },
  });
  if (result.count === 0) throw new Error("Agendamento não encontrado.");
}

export async function rescheduleByClient(
  businessId: string,
  phone: string,
  appointmentId: string,
  newStartAt: Date,
) {
  const existing = await prisma.appointment.findFirst({
    where: { id: appointmentId, businessId, customerPhone: phone, status: "CONFIRMED" },
    include: { business: true },
  });
  if (!existing) throw new Error("Agendamento não encontrado.");
  await assertSlotOffered(
    businessId,
    existing.serviceId,
    newStartAt,
    existing.business.timezone,
  );

  return prisma.$transaction(async (tx) => {
    const old = await tx.appointment.findFirst({
      where: { id: appointmentId, businessId, customerPhone: phone, status: "CONFIRMED" },
    });
    if (!old) throw new Error("Agendamento não encontrado.");

    const service = await tx.service.findFirstOrThrow({
      where: { id: old.serviceId, businessId, active: true },
    });
    const endAt = new Date(newStartAt.getTime() + service.durationMinutes * 60 * 1000);
    await assertSlotFree(tx, businessId, newStartAt, endAt);

    await tx.appointment.update({
      where: { id: old.id },
      data: { status: "RESCHEDULED" },
    });

    return tx.appointment.create({
      data: {
        businessId,
        serviceId: service.id,
        customerName: old.customerName,
        customerPhone: phone,
        startAt: newStartAt,
        endAt,
        status: "CONFIRMED",
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationSnapshot: service.durationMinutes,
        rescheduledFromId: old.id,
      },
    });
  });
}
