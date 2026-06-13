import { LocalFileStorage } from "@/adapters/local-file-storage";
import { requireProfessional } from "@/lib/auth-guard";
import { updateLogoUrl } from "@/services/business-service";
import { NextResponse } from "next/server";

const storage = new LocalFileStorage();
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  const session = await requireProfessional();
  const form = await req.formData();
  const file = form.get("logo");

  if (!(file instanceof File) || !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Arquivo invalido." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 2MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const key = `logo-${session.businessId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await storage.save(key, buffer, file.type);
  await updateLogoUrl(session.businessId!, url);

  return NextResponse.redirect(new URL("/admin/business", req.url));
}
