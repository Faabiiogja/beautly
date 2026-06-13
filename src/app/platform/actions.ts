"use server";

import { requirePlatformAdmin } from "@/lib/auth-guard";
import { setProfessionalStatus } from "@/services/professional-service";
import { revalidatePath } from "next/cache";

export async function toggleStatusAction(formData: FormData) {
  await requirePlatformAdmin();
  const businessId = String(formData.get("businessId"));
  const next = String(formData.get("next")) as "ACTIVE" | "INACTIVE";
  await setProfessionalStatus(businessId, next);
  revalidatePath("/platform");
}
