import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

/** Início (inclusivo) e fim (exclusivo) em UTC de um dia local "YYYY-MM-DD". */
export function dayRangeUtc(dateStr: string, timeZone: string) {
  const start = fromZonedTime(`${dateStr}T00:00:00`, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Instante UTC para `minutes` desde a meia-noite local do dia. */
export function minutesToUtc(
  dateStr: string,
  minutes: number,
  timeZone: string,
): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, timeZone);
}

/** Dia da semana (0=domingo) da data civil "YYYY-MM-DD". */
export function localWeekday(dateStr: string, _timeZone: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

/** Minutos desde a meia-noite local de um instante UTC. */
export function utcToLocalMinutes(date: Date, timeZone: string): number {
  const [h, m] = formatInTimeZone(date, timeZone, "HH:mm").split(":").map(Number);
  return h * 60 + m;
}

/** Data local atual como "YYYY-MM-DD". */
export function todayLocalDateStr(timeZone: string): string {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

/** Diferença em dias civis (to - from). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}
