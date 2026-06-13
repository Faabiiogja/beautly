"use server";

import { getSession } from "@/lib/session";
import { authenticate } from "@/services/auth-service";
import { redirect } from "next/navigation";
import { z } from "zod";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export interface AdminLoginState {
  error?: string;
}

export async function loginAction(
  _prev: AdminLoginState | null,
  formData: FormData,
): Promise<AdminLoginState> {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result || result.role !== "PROFESSIONAL") {
    return { error: "E-mail ou senha incorretos." };
  }

  const session = await getSession();
  session.userId = result.userId;
  session.role = result.role;
  session.businessId = result.businessId;
  await session.save();
  redirect("/admin");
}
