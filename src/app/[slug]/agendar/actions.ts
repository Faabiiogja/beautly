"use server";

import { getClientSession } from "@/lib/client-session";
import { confirmBooking, SlotTakenError } from "@/services/booking-service";
import { sendOtp, verifyOtp } from "@/services/otp-service";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { redirect } from "next/navigation";
import { z } from "zod";

const sendSchema = z.object({
  slug: z.string(),
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
  if (!parsed.success) return { error: "Telefone invalido." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") return { error: "Indisponivel." };

  await sendOtp(business.id, parsed.data.phone);
  return { sent: true };
}

const confirmSchema = z.object({
  slug: z.string(),
  serviceId: z.string(),
  startAt: z.string(),
  customerName: z.string().min(1),
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

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") return { error: "Indisponivel." };

  const ok = await verifyOtp(business.id, parsed.data.phone, parsed.data.code);
  if (!ok) return { error: "Codigo invalido ou expirado." };

  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = parsed.data.phone;
  await session.save();

  try {
    await confirmBooking({
      businessId: business.id,
      serviceId: parsed.data.serviceId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.phone,
      startAt: new Date(parsed.data.startAt),
    });
  } catch (error) {
    if (error instanceof SlotTakenError) return { error: error.message };
    return { error: "Nao foi possivel confirmar." };
  }

  redirect(
    `/${parsed.data.slug}/agendar/confirmado?startAt=${encodeURIComponent(
      parsed.data.startAt,
    )}&serviceId=${parsed.data.serviceId}`,
  );
}
