"use server";

import { requireProfessional } from "@/lib/auth-guard";
import {
  createService,
  setServiceActive,
  updateService,
} from "@/services/service-catalog";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(5),
});

export async function createServiceAction(formData: FormData) {
  const session = await requireProfessional();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) return;
  await createService(session.businessId!, parsed.data);
  revalidatePath("/admin/services");
}

export async function updateServiceAction(formData: FormData) {
  const session = await requireProfessional();
  const id = String(formData.get("id"));
  const parsed = schema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) return;
  await updateService(session.businessId!, id, parsed.data);
  revalidatePath("/admin/services");
}

export async function toggleServiceAction(formData: FormData) {
  const session = await requireProfessional();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  await setServiceActive(session.businessId!, id, active);
  revalidatePath("/admin/services");
}
