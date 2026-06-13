import fs from "node:fs/promises";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalFileStorage } from "./local-file-storage";

const root = path.join(process.cwd(), "public", "uploads");

describe("LocalFileStorage", () => {
  afterEach(async () => {
    await fs.rm(path.join(root, "test-key.png"), { force: true });
  });

  it("writes the file under public/uploads and returns a public URL", async () => {
    const storage = new LocalFileStorage();
    const url = await storage.save("test-key.png", Buffer.from("abc"), "image/png");

    expect(url).toBe("/uploads/test-key.png");
    const written = await fs.readFile(path.join(root, "test-key.png"), "utf8");
    expect(written).toBe("abc");
  });
});
