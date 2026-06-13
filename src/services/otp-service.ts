import {
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
} from "@/lib/constants";
import { otpSender } from "@/lib/otp-provider";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  const max = 10 ** OTP_LENGTH;
  return String(Math.floor(Math.random() * max)).padStart(OTP_LENGTH, "0");
}

export async function sendOtp(
  businessId: string,
  phone: string,
): Promise<string> {
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
  if (record.attempts >= OTP_MAX_ATTEMPTS) return false;

  const ok = await verifyPassword(code, record.codeHash);
  if (!ok) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
