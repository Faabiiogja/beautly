import crypto from "node:crypto";
import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_MAX_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_MINUTES,
} from "@/lib/constants";
import { otpSender } from "@/lib/otp-provider";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export class OtpRateLimitError extends Error {
  constructor() {
    super("Aguarde um pouco antes de pedir um novo código.");
    this.name = "OtpRateLimitError";
  }
}

function generateCode(): string {
  return String(crypto.randomInt(0, 10 ** OTP_LENGTH)).padStart(
    OTP_LENGTH,
    "0",
  );
}

export async function sendOtp(
  businessId: string,
  phone: string,
): Promise<string> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await prisma.otpVerification.findMany({
    where: { businessId, phone, createdAt: { gt: oneHourAgo } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const cooldownStart = Date.now() - OTP_RESEND_COOLDOWN_SECONDS * 1000;
  if (
    recent.length >= OTP_MAX_PER_HOUR ||
    (recent[0] && recent[0].createdAt.getTime() > cooldownStart)
  ) {
    throw new OtpRateLimitError();
  }

  const code = generateCode();
  await prisma.otpVerification.create({
    data: {
      businessId,
      phone,
      codeHash: await hashPassword(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  await otpSender.send(phone, code);
  return code;
}

export async function verifyOtp(
  businessId: string,
  phone: string,
  code: string,
): Promise<boolean> {
  const record = await prisma.otpVerification.findFirst({
    where: { businessId, phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;

  // Reserva a tentativa de forma atômica para impedir que requisições em
  // paralelo ultrapassem o limite de tentativas. Re-confirma expiresAt aqui
  // para fechar a janela TOCTOU entre o findFirst acima e este update.
  const claimed = await prisma.otpVerification.updateMany({
    where: {
      id: record.id,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      attempts: { lt: OTP_MAX_ATTEMPTS },
    },
    data: { attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return false;

  const ok = await verifyPassword(code, record.codeHash);
  if (!ok) return false;

  const consumed = await prisma.otpVerification.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return consumed.count === 1;
}
