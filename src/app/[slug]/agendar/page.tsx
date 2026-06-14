import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { todayLocalDateStr } from "@/lib/timezone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

const WEEKDAYS = ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"];

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  return date.toISOString().slice(0, 10);
}

/** Date a partir de uma data-calendário (YYYY-MM-DD), fixada ao meio-dia UTC
 *  para que a formatação reflita o dia correto sem desvio de fuso. */
function noonUtc(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string; date?: string }>;
}) {
  const { slug } = await params;
  const { serviceId, date } = await searchParams;
  const business = await findBusinessBySlug(slug);
  if (!business || business.status !== "ACTIVE" || !serviceId) notFound();

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, active: true },
  });
  if (!service) notFound();

  const today = todayLocalDateStr(business.timezone);
  const selectedDate = date ?? today;
  const slots = await availableSlots(business.id, serviceId, selectedDate);

  const days = Array.from({ length: BOOKING_WINDOW_DAYS + 1 }, (_, i) => {
    const value = addDays(today, i);
    const reference = noonUtc(value);
    return {
      value,
      weekday: WEEKDAYS[reference.getUTCDay()],
      day: String(reference.getUTCDate()),
    };
  });

  const reference = noonUtc(selectedDate);
  const monthLabel = capitalize(format(reference, "MMMM yyyy", { locale: ptBR }));
  const selectedLabel = format(reference, "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="overflow-hidden rounded-[32px] bg-[#faf8fb] shadow-[0_30px_60px_-30px_rgba(157,23,77,0.35)] ring-1 ring-black/5">
        <div className="border-b border-[#f1ebf2] bg-white px-5 py-3.5">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9b6aa0]"
          >
            ← Voltar
          </Link>
        </div>

        <div className="px-5 pb-7 pt-5">
          <div className="mb-6 flex items-center gap-3.5 rounded-[20px] border border-[#f4dcee] bg-gradient-to-br from-[#fdeef7] to-[#f3ecfb] p-4">
            <span className="gradient-brand flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[14px] text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 1.5c.9 5.2 3.4 7.7 8.6 8.6-5.2.9-7.7 3.4-8.6 8.6-.9-5.2-3.4-7.7-8.6-8.6 5.2-.9 7.7-3.4 8.6-8.6Z" />
              </svg>
            </span>
            <div className="flex-1">
              <p className="text-[15px] font-semibold text-[#2c1f29]">
                {service.name}
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-[#9b8a98]">
                {service.durationMinutes} min
              </p>
            </div>
            <span className="font-display text-[19px] font-semibold text-[#be185d]">
              R$ {service.price}
            </span>
          </div>

          <BookingForm
            slug={slug}
            serviceId={serviceId}
            selectedDate={selectedDate}
            monthLabel={monthLabel}
            selectedLabel={selectedLabel}
            days={days}
            slots={slots.map((slot) => ({
              iso: slot.startAt.toISOString(),
              label: slot.label,
            }))}
          />
        </div>
      </div>
    </main>
  );
}
