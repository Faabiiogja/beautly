"use server";

import { requireProfessional } from "@/lib/auth-guard";
import { updateWeeklyHours } from "@/services/business-service";
import { revalidatePath } from "next/cache";

export async function saveHoursAction(formData: FormData) {
  const session = await requireProfessional();
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isOpen: formData.get(`open-${weekday}`) === "on",
    startTime: String(formData.get(`start-${weekday}`) || "09:00"),
    endTime: String(formData.get(`end-${weekday}`) || "18:00"),
  }));
  await updateWeeklyHours(session.businessId!, rows);
  revalidatePath("/admin/business/hours");
}
