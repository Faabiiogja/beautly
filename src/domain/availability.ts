import { overlaps } from "./interval";
import { generateCandidates } from "./slots";

export interface BusyInterval {
  startMin: number;
  endMin: number;
}

export interface AvailabilityInput {
  isOpen: boolean;
  isDayClosed: boolean;
  startMin: number;
  endMin: number;
  interval: number;
  duration: number;
  busy: BusyInterval[];
  /** Slots devem começar em ou após este minuto (ex: minuto atual quando é hoje). */
  earliestStartMin: number;
}

/**
 * Slots livres (minutos da meia-noite) para um serviço num dia.
 * Aplica regras 11.3 (conflito), 11.4 (encaixe da duração), 11.5 (dia fechado),
 * 21.2 (horário passado) e disponibilidade do dia da semana.
 */
export function computeAvailableSlots(input: AvailabilityInput): number[] {
  if (!input.isOpen || input.isDayClosed) return [];

  const candidates = generateCandidates({
    startMin: input.startMin,
    endMin: input.endMin,
    interval: input.interval,
    duration: input.duration,
  });

  return candidates.filter((start) => {
    if (start < input.earliestStartMin) return false;
    const end = start + input.duration;
    return !input.busy.some((busy) =>
      overlaps(start, end, busy.startMin, busy.endMin),
    );
  });
}
