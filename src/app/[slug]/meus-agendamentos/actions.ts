"use server";

import { getClientSession } from "@/lib/client-session";
import {
  cancelByClient,
  rescheduleByClient,
  SlotTakenError,
} from "@/services/booking-service";
import { sendOtp, verifyOtp } from "@/services/otp-service";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface AccessState {
  error?: string;
  sent?: boolean;
  ok?: boolean;
}

export async function requestAccessAction(
  _prev: AccessState | null,
  formData: FormData,
): Promise<AccessState> {
  const slug = String(formData.get("slug"));
  const phone = String(formData.get("phone"));
  const business = await findBusinessBySlug(slug);
  if (!business) return { error: "Indisponivel." };
  await sendOtp(business.id, phone);
  return { sent: true };
}

export async function verifyAccessAction(
  _prev: AccessState | null,
  formData: FormData,
): Promise<AccessState> {
  const schema = z.object({
    slug: z.string(),
    phone: z.string().min(8),
    code: z.string().min(4),
  });
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Dados invalidos." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business) return { error: "Indisponivel." };

  const ok = await verifyOtp(business.id, parsed.data.phone, parsed.data.code);
  if (!ok) return { error: "Codigo invalido ou expirado." };

  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = parsed.data.phone;
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

export async function rescheduleAction(
  _prev: RescheduleState | null,
  formData: FormData,
): Promise<RescheduleState> {
  const slug = String(formData.get("slug"));
  const business = await findBusinessBySlug(slug);
  if (!business) return { error: "Indisponivel." };
  const session = await getClientSession();
  if (session.businessId !== business.id || !session.phone) {
    return { error: "Sessao expirada." };
  }

  try {
    await rescheduleByClient(
      business.id,
      session.phone,
      String(formData.get("id")),
      new Date(String(formData.get("startAt"))),
    );
  } catch (error) {
    if (error instanceof SlotTakenError) return { error: error.message };
    return { error: "Nao foi possivel remarcar." };
  }
  revalidatePath(`/${slug}/meus-agendamentos`);
  return { ok: true };
}
