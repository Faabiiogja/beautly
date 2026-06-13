import type { FileStorage } from "@/ports/file-storage";
import { prisma } from "@/lib/prisma";

/**
 * Adapter de produção (Vercel): o filesystem é somente leitura/efêmero,
 * então os arquivos vão para o Postgres e são servidos por /api/files/<key>.
 */
export class DbFileStorage implements FileStorage {
  async save(key: string, data: Buffer, contentType: string): Promise<string> {
    const bytes = new Uint8Array(data);
    await prisma.storedFile.upsert({
      where: { key },
      create: { key, data: bytes, contentType },
      update: { data: bytes, contentType },
    });
    // O sufixo de versão invalida caches quando o arquivo é substituído.
    return `/api/files/${key}?v=${Date.now()}`;
  }
}
