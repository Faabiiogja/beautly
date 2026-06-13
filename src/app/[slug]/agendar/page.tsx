import { prisma } from "@/lib/prisma";
import { todayLocalDateStr } from "@/lib/timezone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import { notFound } from "next/navigation";
import { BookingForm } from "./booking-form";

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

  const selectedDate = date ?? todayLocalDateStr(business.timezone);
  const slots = await availableSlots(business.id, serviceId, selectedDate);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-1 text-xl font-semibold">{service.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        R$ {service.price} · {service.durationMinutes}min
      </p>

      <BookingForm
        slug={slug}
        serviceId={serviceId}
        selectedDate={selectedDate}
        slots={slots.map((slot) => ({
          iso: slot.startAt.toISOString(),
          label: slot.label,
        }))}
      />
    </main>
  );
}
