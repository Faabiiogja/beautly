import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import type { BusinessStatus } from "@prisma/client";

export interface CreateProfessionalInput {
  businessName: string;
  slug: string;
  contactPhone: string;
  email: string;
  password: string;
  startActive: boolean;
}

function defaultWeeklyHours() {
  return Array.from({ length: 7 }, (_, weekday) => {
    const isWeekday = weekday >= 1 && weekday <= 5;
    return {
      weekday,
      isOpen: isWeekday,
      startTime: "09:00",
      endTime: "18:00",
    };
  });
}

export async function createProfessional(input: CreateProfessionalInput) {
  const passwordHash = await hashPassword(input.password);

  const business = await prisma.business.create({
    data: {
      slug: input.slug,
      name: input.businessName,
      contactPhone: input.contactPhone,
      status: input.startActive ? "ACTIVE" : "INACTIVE",
      weeklyHours: { create: defaultWeeklyHours() },
      users: {
        create: {
          email: input.email,
          passwordHash,
          role: "PROFESSIONAL",
        },
      },
    },
  });

  return { businessId: business.id };
}

export async function setProfessionalStatus(
  businessId: string,
  status: BusinessStatus,
) {
  await prisma.business.update({ where: { id: businessId }, data: { status } });
}

export function listProfessionals() {
  return prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: true },
  });
}
