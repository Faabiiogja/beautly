import { prisma } from "@/lib/prisma";

export function findBusinessBySlug(slug: string) {
  return prisma.business.findUnique({ where: { slug } });
}
