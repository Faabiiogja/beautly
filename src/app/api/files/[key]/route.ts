import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const file = await prisma.storedFile.findUnique({ where: { key } });
  if (!file) return new Response(null, { status: 404 });

  return new Response(Buffer.from(file.data), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=3600, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
