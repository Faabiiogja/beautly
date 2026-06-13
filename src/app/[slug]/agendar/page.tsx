import { BOOKING_WINDOW_DAYS } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { todayLocalDateStr } from "@/lib/timezone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days, 12));
  return date.toISOString().slice(0, 10);
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

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-700"
      >
        ← Voltar para {business.name}
      </Link>

      <div className="card mb-6 flex items-center justify-between gap-3 p-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-zinc-900">
            {service.name}
          </h1>
          <p className="text-sm text-zinc-500">{service.durationMinutes} min</p>
        </div>
        <span className="font-semibold text-brand-700">R$ {service.price}</span>
      </div>

      <BookingForm
        slug={slug}
        serviceId={serviceId}
        selectedDate={selectedDate}
        minDate={today}
        maxDate={addDays(today, BOOKING_WINDOW_DAYS)}
        slots={slots.map((slot) => ({
          iso: slot.startAt.toISOString(),
          label: slot.label,
        }))}
      />
    </main>
  );
}
