import { fileStorage } from "@/lib/file-storage";
import { requireProfessional } from "@/lib/auth-guard";
import { updateLogoUrl } from "@/services/business-service";
import { NextResponse } from "next/server";

const ALLOWED = ["image/png", "image/jpeg", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await requireProfessional();
  const form = await req.formData();
  const file = form.get("logo");

  if (!(file instanceof File) || !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Máximo de 2MB." }, { status: 400 });
  }

  const key = `logo-${session.businessId}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await fileStorage.save(key, buffer, file.type);
  await updateLogoUrl(session.businessId!, url);

  return NextResponse.redirect(new URL("/admin/business", req.url), 303);
}
