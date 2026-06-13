"use server";

import { requireProfessional } from "@/lib/auth-guard";
import {
  cancelByProfessional,
  closeDay,
  reopenDay,
} from "@/services/agenda-service";
import { revalidatePath } from "next/cache";

export async function closeDayAction(formData: FormData) {
  const session = await requireProfessional();
  await closeDay(session.businessId!, String(formData.get("date")));
  revalidatePath("/admin/agenda");
}

export async function reopenDayAction(formData: FormData) {
  const session = await requireProfessional();
  await reopenDay(session.businessId!, String(formData.get("date")));
  revalidatePath("/admin/agenda");
}

export async function cancelAppointmentAction(formData: FormData) {
  const session = await requireProfessional();
  await cancelByProfessional(session.businessId!, String(formData.get("id")));
  revalidatePath("/admin/agenda");
}
