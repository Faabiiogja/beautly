import { prisma } from "@/lib/prisma";

/** Limpa as tabelas na ordem segura de FKs. Use em beforeEach de testes de integração. */
export async function resetDb() {
  await prisma.appointment.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.dayClosure.deleteMany();
  await prisma.weeklyHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
}
