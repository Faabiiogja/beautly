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

/** Regra 9.3: negócio pronto = ativo + ≥1 serviço ativo + ≥1 dia da semana aberto. */
export async function isBusinessReady(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUniqueOrThrow({
    where: { id: businessId },
  });
  if (business.status !== "ACTIVE") return false;
  if (!business.contactPhone || !business.name) return false;

  const activeServices = await prisma.service.count({
    where: { businessId, active: true },
  });
  if (activeServices === 0) return false;

  const openDays = await prisma.weeklyHours.count({
    where: { businessId, isOpen: true },
  });
  return openDays > 0;
}
