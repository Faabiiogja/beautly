import fs from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "@/ports/file-storage";

/** Adapter de desenvolvimento: grava em public/uploads e serve via /uploads/<key>. */
export class LocalFileStorage implements FileStorage {
  private readonly root = path.join(process.cwd(), "public", "uploads");

  async save(key: string, data: Buffer, contentType: string): Promise<string> {
    void contentType;
    await fs.mkdir(this.root, { recursive: true });
    await fs.writeFile(path.join(this.root, key), data);
    return `/uploads/${key}`;
  }
}
