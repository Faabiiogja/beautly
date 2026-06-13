"use server";

import { requireProfessional } from "@/lib/auth-guard";
import { updateWeeklyHours } from "@/services/business-service";
import { revalidatePath } from "next/cache";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface HoursState {
  error?: string;
  ok?: boolean;
}

export async function saveHoursAction(
  _prev: HoursState | null,
  formData: FormData,
): Promise<HoursState> {
  const session = await requireProfessional();
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isOpen: formData.get(`open-${weekday}`) === "on",
    startTime: String(formData.get(`start-${weekday}`) || "09:00"),
    endTime: String(formData.get(`end-${weekday}`) || "18:00"),
  }));

  for (const row of rows) {
    if (!HHMM.test(row.startTime) || !HHMM.test(row.endTime)) {
      return { error: "Horário inválido. Use o formato HH:MM." };
    }
    if (row.isOpen && row.startTime >= row.endTime) {
      return { error: "O início deve ser antes do fim em todos os dias abertos." };
    }
  }

  await updateWeeklyHours(session.businessId!, rows);
  revalidatePath("/admin/business/hours");
  return { ok: true };
}
