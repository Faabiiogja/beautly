import { describe, expect, it } from "vitest";
import { detectImageMimeType } from "./file-signature";

function bytes(...vals: number[]): Uint8Array {
  return new Uint8Array(vals);
}

function pad(prefix: number[], length = 32): Uint8Array {
  const filler = Array.from({ length: length - prefix.length }, () => 0);
  return new Uint8Array([...prefix, ...filler]);
}

describe("detectImageMimeType", () => {
  it("detecta PNG pelos magic bytes", () => {
    const png = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
    expect(detectImageMimeType(pad([...png]))).toBe("image/png");
  });

  it("detecta JPEG pelos magic bytes", () => {
    const jpeg = bytes(0xff, 0xd8, 0xff, 0xe0);
    expect(detectImageMimeType(pad([...jpeg]))).toBe("image/jpeg");
  });

  it("detecta WebP (RIFF....WEBP)", () => {
    const webp = bytes(
      0x52, 0x49, 0x46, 0x46, // RIFF
      0x1a, 0x00, 0x00, 0x00, // tamanho (qualquer)
      0x57, 0x45, 0x42, 0x50, // WEBP
    );
    expect(detectImageMimeType(pad([...webp]))).toBe("image/webp");
  });

  it("rejeita conteúdo que não é imagem (HTML/JS disfarçado)", () => {
    const html = pad([0x3c, 0x68, 0x74, 0x6d, 0x6c, 0x3e]); // "<html>"
    expect(detectImageMimeType(html)).toBeNull();
  });

  it("rejeita buffer vazio", () => {
    expect(detectImageMimeType(new Uint8Array(0))).toBeNull();
  });

  it("rejeita PNG truncado (magic bytes incompletos)", () => {
    expect(detectImageMimeType(bytes(0x89, 0x50))).toBeNull();
  });

  it("rejeita WebP sem a assinatura WEBP no offset 8", () => {
    const fake = bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x58, 0x58, 0x58, 0x58);
    expect(detectImageMimeType(fake)).toBeNull();
  });
});
