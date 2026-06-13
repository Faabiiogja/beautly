"use server";

import { requireProfessional } from "@/lib/auth-guard";
import { updateBusinessProfile } from "@/services/business-service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  contactPhone: z.string().min(8),
  defaultMessage: z.string().max(500).optional(),
  slotIntervalMinutes: z.coerce.number().int().min(5).max(240),
});

export interface BusinessActionState {
  error?: string;
  ok?: boolean;
}

export async function saveBusinessAction(
  _prev: BusinessActionState | null,
  formData: FormData,
): Promise<BusinessActionState> {
  const session = await requireProfessional();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    contactPhone: formData.get("contactPhone"),
    defaultMessage: formData.get("defaultMessage") || undefined,
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
  });
  if (!parsed.success) return { error: "Dados invalidos." };

  await updateBusinessProfile(session.businessId!, parsed.data);
  revalidatePath("/admin/business");
  return { ok: true };
}
