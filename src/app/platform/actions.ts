"use server";

import { requirePlatformAdmin } from "@/lib/auth-guard";
import { setProfessionalStatus } from "@/services/professional-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  businessId: z.string().min(1),
  next: z.enum(["ACTIVE", "INACTIVE"]),
});

export async function toggleStatusAction(formData: FormData) {
  await requirePlatformAdmin();
  const parsed = schema.safeParse({
    businessId: formData.get("businessId"),
    next: formData.get("next"),
  });
  if (!parsed.success) return;
  await setProfessionalStatus(parsed.data.businessId, parsed.data.next);
  revalidatePath("/platform");
}
