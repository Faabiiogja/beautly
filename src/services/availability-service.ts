import {
  computeAvailableSlots,
  type BusyInterval,
} from "@/domain/availability";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import {
  dayRangeUtc,
  daysBetween,
  localWeekday,
  minutesToUtc,
  todayLocalDateStr,
  utcToLocalMinutes,
} from "@/lib/timezone";

export interface Slot {
  startAt: Date;
  label: string;
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minToLabel(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export async function availableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
): Promise<Slot[]> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.status !== "ACTIVE") return [];

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId, active: true },
  });
  if (!service) return [];

  const tz = business.timezone;
  const today = todayLocalDateStr(tz);
  const delta = daysBetween(today, dateStr);
  if (delta < 0 || delta > BOOKING_WINDOW_DAYS) return [];

  const weekday = localWeekday(dateStr, tz);
  const hours = await prisma.weeklyHours.findUnique({
    where: { businessId_weekday: { businessId, weekday } },
  });
  if (!hours || !hours.isOpen) return [];

  const closed = await prisma.dayClosure.findUnique({
    where: {
      businessId_date: {
        businessId,
        date: new Date(`${dateStr}T00:00:00.000Z`),
      },
    },
  });

  const { start, end } = dayRangeUtc(dateStr, tz);
  const confirmed = await prisma.appointment.findMany({
    where: {
      businessId,
      status: "CONFIRMED",
      startAt: { gte: start, lt: end },
    },
  });
  const busy: BusyInterval[] = confirmed.map((appointment) => ({
    startMin: utcToLocalMinutes(appointment.startAt, tz),
    endMin: utcToLocalMinutes(appointment.endAt, tz),
  }));

  const earliestStartMin = delta === 0 ? utcToLocalMinutes(new Date(), tz) : 0;

  const minutes = computeAvailableSlots({
    isOpen: hours.isOpen,
    isDayClosed: closed !== null,
    startMin: hhmmToMin(hours.startTime),
    endMin: hhmmToMin(hours.endTime),
    interval: business.slotIntervalMinutes,
    duration: service.durationMinutes,
    busy,
    earliestStartMin,
  });

  return minutes.map((min) => ({
    startAt: minutesToUtc(dateStr, min, tz),
    label: minToLabel(min),
  }));
}
