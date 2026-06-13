import { prisma } from "@/lib/prisma";

export function getBusiness(businessId: string) {
  return prisma.business.findUniqueOrThrow({ where: { id: businessId } });
}

export interface BusinessProfileInput {
  name: string;
  contactPhone: string;
  defaultMessage?: string | null;
  slotIntervalMinutes: number;
}

export async function updateBusinessProfile(
  businessId: string,
  input: BusinessProfileInput,
) {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      contactPhone: input.contactPhone,
      defaultMessage: input.defaultMessage ?? null,
      slotIntervalMinutes: input.slotIntervalMinutes,
    },
  });
}

export async function updateLogoUrl(businessId: string, logoUrl: string) {
  await prisma.business.update({ where: { id: businessId }, data: { logoUrl } });
}

export interface BusinessReadiness {
  active: boolean;
  hasContact: boolean;
  hasActiveService: boolean;
  hasOpenDay: boolean;
  ready: boolean;
}

/** Regra 9.3: negócio pronto = ativo + dados de contato + ≥1 serviço ativo + ≥1 dia aberto. */
export async function businessReadiness(
  businessId: string,
): Promise<BusinessReadiness> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });
  const activeServices = await prisma.service.count({
    where: { businessId, active: true },
  });
  const openDays = await prisma.weeklyHours.count({
    where: { businessId, isOpen: true },
  });

  const active = business.status === "ACTIVE";
  const hasContact = Boolean(business.contactPhone && business.name);
  const hasActiveService = activeServices > 0;
  const hasOpenDay = openDays > 0;
  return {
    active,
    hasContact,
    hasActiveService,
    hasOpenDay,
    ready: active && hasContact && hasActiveService && hasOpenDay,
  };
}

export async function isBusinessReady(businessId: string): Promise<boolean> {
  return (await businessReadiness(businessId)).ready;
}

export function getWeeklyHours(businessId: string) {
  return prisma.weeklyHours.findMany({
    where: { businessId },
    orderBy: { weekday: "asc" },
  });
}

export interface WeeklyHoursRow {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export async function updateWeeklyHours(
  businessId: string,
  rows: WeeklyHoursRow[],
) {
  await prisma.$transaction(
    rows.map((row) =>
      prisma.weeklyHours.update({
        where: { businessId_weekday: { businessId, weekday: row.weekday } },
        data: {
          isOpen: row.isOpen,
          startTime: row.startTime,
          endTime: row.endTime,
        },
      }),
    ),
  );
}
