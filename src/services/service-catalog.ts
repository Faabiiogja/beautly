import { prisma } from "@/lib/prisma";

export interface ServiceInput {
  name: string;
  price: number;
  durationMinutes: number;
}

export function createService(businessId: string, input: ServiceInput) {
  return prisma.service.create({
    data: { businessId, ...input, active: true },
  });
}

/** Atualiza apenas se o serviço pertencer ao negócio (isolamento, regra 9.1). */
export async function updateService(
  businessId: string,
  serviceId: string,
  input: ServiceInput,
) {
  const result = await prisma.service.updateMany({
    where: { id: serviceId, businessId },
    data: input,
  });
  if (result.count === 0) throw new Error("Serviço não encontrado.");
}

export async function setServiceActive(
  businessId: string,
  serviceId: string,
  active: boolean,
) {
  const result = await prisma.service.updateMany({
    where: { id: serviceId, businessId },
    data: { active },
  });
  if (result.count === 0) throw new Error("Serviço não encontrado.");
}

export function listServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId },
    orderBy: { createdAt: "asc" },
  });
}

export function listActiveServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId, active: true },
    orderBy: { createdAt: "asc" },
  });
}
