import { prisma } from "@/lib/prisma";

/** Limpa as tabelas na ordem segura de FKs. Use em beforeEach de testes de integração. */
export async function resetDb() {
  try {
    await truncateAll();
  } catch (error) {
    if (!isClosedConnection(error)) throw error;
    await prisma.$disconnect();
    await truncateAll();
  }
}

function truncateAll() {
  return prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "Appointment", "OtpVerification", "DayClosure", "WeeklyHours", "Service", "User", "Business", "StoredFile", "LoginAttempt" RESTART IDENTITY CASCADE',
  );
}

function isClosedConnection(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("Server has closed the connection") ||
      error.message.includes("prepared statement"))
  );
}
