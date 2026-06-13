export interface GenerateCandidatesInput {
  startMin: number;
  endMin: number;
  interval: number;
  duration: number;
}

/**
 * Horários de início (em minutos da meia-noite) a cada `interval`, tais que
 * `start + duration <= endMin` (regra 11.4: o serviço precisa caber antes do fim).
 */
export function generateCandidates({
  startMin,
  endMin,
  interval,
  duration,
}: GenerateCandidatesInput): number[] {
  const result: number[] = [];
  for (let t = startMin; t + duration <= endMin; t += interval) {
    result.push(t);
  }
  return result;
}
