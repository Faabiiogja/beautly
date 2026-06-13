"use server";

import { getClientSession } from "@/lib/client-session";
import { normalizePhone } from "@/lib/phone";
import { confirmBooking, SlotTakenError } from "@/services/booking-service";
import { OtpRateLimitError, sendOtp, verifyOtp } from "@/services/otp-service";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { redirect } from "next/navigation";
import { z } from "zod";

const sendSchema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
});

export interface SendCodeState {
  error?: string;
  sent?: boolean;
}

export async function sendCodeAction(
  _prev: SendCodeState | null,
  formData: FormData,
): Promise<SendCodeState> {
  const parsed = sendSchema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: "Telefone inválido." };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Informe o telefone com DDD, ex: 11 99999-8888." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") {
    return { error: "Agendamentos indisponíveis no momento." };
  }

  try {
    await sendOtp(business.id, phone);
  } catch (error) {
    if (error instanceof OtpRateLimitError) return { error: error.message };
    return { error: "Não foi possível enviar o código. Tente novamente." };
  }
  return { sent: true };
}

const confirmSchema = z.object({
  slug: z.string().min(1),
  serviceId: z.string().min(1),
  startAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida."),
  customerName: z.string().trim().min(2).max(120),
  phone: z.string().min(8),
  code: z.string().min(4),
});

export interface ConfirmState {
  error?: string;
}

export async function confirmAction(
  _prev: ConfirmState | null,
  formData: FormData,
): Promise<ConfirmState> {
  const parsed = confirmSchema.safeParse({
    slug: formData.get("slug"),
    serviceId: formData.get("serviceId"),
    startAt: formData.get("startAt"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Preencha todos os campos." };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Informe o telefone com DDD, ex: 11 99999-8888." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") {
    return { error: "Agendamentos indisponíveis no momento." };
  }

  const ok = await verifyOtp(business.id, phone, parsed.data.code);
  if (!ok) return { error: "Código inválido ou expirado." };

  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = phone;
  await session.save();

  try {
    await confirmBooking({
      businessId: business.id,
      serviceId: parsed.data.serviceId,
      customerName: parsed.data.customerName,
      customerPhone: phone,
      startAt: new Date(parsed.data.startAt),
    });
  } catch (error) {
    if (error instanceof SlotTakenError) return { error: error.message };
    return { error: "Não foi possível confirmar. Tente novamente." };
  }

  redirect(
    `/${parsed.data.slug}/agendar/confirmado?startAt=${encodeURIComponent(
      parsed.data.startAt,
    )}&serviceId=${parsed.data.serviceId}`,
  );
}
