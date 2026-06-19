"use server";

import { requirePlatformAdmin } from "@/lib/auth-guard";
import { validatePassword } from "@/lib/password-policy";
import { createProfessional } from "@/services/professional-service";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({
  businessName: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  contactPhone: z.string().min(8),
  email: z.string().email(),
  password: z.string().superRefine((value, ctx) => {
    const check = validatePassword(value);
    if (!check.ok) {
      ctx.addIssue({ code: "custom", message: check.error! });
    }
  }),
  startActive: z.coerce.boolean(),
});

export interface CreateProfessionalState {
  error?: string;
}

export async function createProfessionalAction(
  _prev: CreateProfessionalState | null,
  formData: FormData,
): Promise<CreateProfessionalState> {
  await requirePlatformAdmin();
  const parsed = schema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    contactPhone: formData.get("contactPhone"),
    email: formData.get("email"),
    password: formData.get("password"),
    startActive: formData.get("startActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createProfessional(parsed.data);
  } catch {
    return { error: "Slug ou e-mail já em uso." };
  }
  redirect("/platform");
}
