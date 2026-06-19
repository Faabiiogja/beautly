import { fileStorage } from "@/lib/file-storage";
import { requireProfessional } from "@/lib/auth-guard";
import { updateLogoUrl } from "@/services/business-service";
import { detectImageMimeType } from "@/lib/file-signature";
import { NextResponse } from "next/server";

const MAX_SIZE = 2 * 1024 * 1024;

export async function POST(req: Request) {
  const session = await requireProfessional();
  const form = await req.formData();
  const file = form.get("logo");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Máximo de 2MB." }, { status: 400 });
  }

  // Valida pelo conteúdo (magic bytes), não pelo Content-Type do cliente —
  // este último é trivialmente forjável e permitiria subir HTML/JS disfarçado.
  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = detectImageMimeType(new Uint8Array(buffer));
  if (!detected) {
    return NextResponse.json(
      { error: "Apenas PNG, JPEG ou WebP reais são aceitos." },
      { status: 400 },
    );
  }

  const key = `logo-${session.businessId}`;
  const url = await fileStorage.save(key, buffer, detected);
  await updateLogoUrl(session.businessId!, url);

  return NextResponse.redirect(new URL("/admin/business", req.url), 303);
}
