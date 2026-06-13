import { prisma } from "@/lib/prisma";
import { dayRangeUtc } from "@/lib/timezone";

export async function listAppointmentsByDay(
  businessId: string,
  dateStr: string,
  timeZone: string,
) {
  const { start, end } = dayRangeUtc(dateStr, timeZone);
  return prisma.appointment.findMany({
    where: {
      businessId,
      status: "CONFIRMED",
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: "asc" },
  });
}

export async function closeDay(businessId: string, dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  await prisma.dayClosure.upsert({
    where: { businessId_date: { businessId, date } },
    create: { businessId, date },
    update: {},
  });
}

export async function reopenDay(businessId: string, dateStr: string) {
  await prisma.dayClosure.deleteMany({
    where: {
      businessId,
      date: new Date(`${dateStr}T00:00:00.000Z`),
    },
  });
}

export async function isDayClosed(
  businessId: string,
  dateStr: string,
): Promise<boolean> {
  const found = await prisma.dayClosure.findUnique({
    where: {
      businessId_date: {
        businessId,
        date: new Date(`${dateStr}T00:00:00.000Z`),
      },
    },
  });
  return found !== null;
}

export async function cancelByProfessional(
  businessId: string,
  appointmentId: string,
) {
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, businessId },
    data: { status: "CANCELED_BY_PROFESSIONAL" },
  });
  if (result.count === 0) throw new Error("Agendamento não encontrado.");
}
