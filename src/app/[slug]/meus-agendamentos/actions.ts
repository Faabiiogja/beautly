"use server";

import { getClientSession } from "@/lib/client-session";
import { normalizePhone } from "@/lib/phone";
import {
  cancelByClient,
  rescheduleByClient,
  SlotTakenError,
} from "@/services/booking-service";
import { OtpRateLimitError, sendOtp, verifyOtp } from "@/services/otp-service";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface AccessState {
  error?: string;
  sent?: boolean;
  ok?: boolean;
}

const requestSchema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
});

export async function requestAccessAction(
  _prev: AccessState | null,
  formData: FormData,
): Promise<AccessState> {
  const parsed = requestSchema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: "Telefone inválido." };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Informe o telefone com DDD, ex: 11 99999-8888." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business) return { error: "Página indisponível." };

  try {
    await sendOtp(business.id, phone);
  } catch (error) {
    if (error instanceof OtpRateLimitError) return { error: error.message };
    return { error: "Não foi possível enviar o código. Tente novamente." };
  }
  return { sent: true };
}

const verifySchema = z.object({
  slug: z.string().min(1),
  phone: z.string().min(8),
  code: z.string().min(4),
});

export async function verifyAccessAction(
  _prev: AccessState | null,
  formData: FormData,
): Promise<AccessState> {
  const parsed = verifySchema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { error: "Informe o telefone com DDD, ex: 11 99999-8888." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business) return { error: "Página indisponível." };

  const ok = await verifyOtp(business.id, phone, parsed.data.code);
  if (!ok) return { error: "Código inválido ou expirado." };

  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = phone;
  await session.save();
  revalidatePath(`/${parsed.data.slug}/meus-agendamentos`);
  return { ok: true };
}

export async function cancelAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const business = await findBusinessBySlug(slug);
  if (!business) return;
  const session = await getClientSession();
  if (session.businessId !== business.id || !session.phone) return;
  await cancelByClient(business.id, session.phone, String(formData.get("id")));
  revalidatePath(`/${slug}/meus-agendamentos`);
}

export interface RescheduleState {
  error?: string;
  ok?: boolean;
}

const rescheduleSchema = z.object({
  slug: z.string().min(1),
  id: z.string().min(1),
  startAt: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida."),
});

export async function rescheduleAction(
  _prev: RescheduleState | null,
  formData: FormData,
): Promise<RescheduleState> {
  const parsed = rescheduleSchema.safeParse({
    slug: formData.get("slug"),
    id: formData.get("id"),
    startAt: formData.get("startAt"),
  });
  if (!parsed.success) return { error: "Escolha um novo horário." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business) return { error: "Página indisponível." };
  const session = await getClientSession();
  if (session.businessId !== business.id || !session.phone) {
    return { error: "Sessão expirada. Confirme seu telefone novamente." };
  }

  try {
    await rescheduleByClient(
      business.id,
      session.phone,
      parsed.data.id,
      new Date(parsed.data.startAt),
    );
  } catch (error) {
    if (error instanceof SlotTakenError) return { error: error.message };
    return { error: "Não foi possível remarcar. Tente novamente." };
  }
  revalidatePath(`/${parsed.data.slug}/meus-agendamentos`);
  return { ok: true };
}
