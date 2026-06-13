import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

export class SlotTakenError extends Error {
  constructor() {
    super("Horario nao esta mais disponivel.");
    this.name = "SlotTakenError";
  }
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
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({
      where: { id: input.businessId },
    });
    if (!business || business.status !== "ACTIVE") {
      throw new Error("Negocio indisponivel.");
    }
    const service = await tx.service.findFirst({
      where: { id: input.serviceId, businessId: input.businessId, active: true },
    });
    if (!service) throw new Error("Servico indisponivel.");

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
  if (result.count === 0) throw new Error("Agendamento nao encontrado.");
}

export async function rescheduleByClient(
  businessId: string,
  phone: string,
  appointmentId: string,
  newStartAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.appointment.findFirst({
      where: { id: appointmentId, businessId, customerPhone: phone, status: "CONFIRMED" },
    });
    if (!old) throw new Error("Agendamento nao encontrado.");

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
