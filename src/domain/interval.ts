/**
 * Intervalos meio-abertos [start, end). Encostar na borda não conta como
 * sobreposição: um serviço que termina às 120 não conflita com outro que começa em 120.
 */
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
