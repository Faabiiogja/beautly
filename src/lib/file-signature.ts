/**
 * Detecta o tipo MIME real de uma imagem a partir dos magic bytes do conteúdo,
 * ignorando o Content-Type enviado pelo cliente (trivialmente forjável).
 * Permite apenas os formatos que o app aceita no upload de logo.
 */
export type SafeImageType = "image/png" | "image/jpeg" | "image/webp";

const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG = [0xff, 0xd8, 0xff];
const RIFF = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP = [0x57, 0x45, 0x42, 0x50]; // "WEBP"

function matches(data: Uint8Array, offset: number, expected: number[]): boolean {
  if (data.length < offset + expected.length) return false;
  return expected.every((byte, i) => data[offset + i] === byte);
}

export function detectImageMimeType(data: Uint8Array): SafeImageType | null {
  if (matches(data, 0, PNG)) return "image/png";
  if (matches(data, 0, JPEG)) return "image/jpeg";
  if (matches(data, 0, RIFF) && matches(data, 8, WEBP)) return "image/webp";
  return null;
}
