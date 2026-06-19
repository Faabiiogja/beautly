import { verifiedPhoneFor } from "@/lib/client-session";
import { formatPhone } from "@/lib/phone";
import { todayLocalDateStr } from "@/lib/timezone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import { listMyAppointments } from "@/services/booking-service";
import { notFound } from "next/navigation";
import { AccessForm } from "./access-form";
import { AppointmentsList } from "./list";

export default async function MyAppointmentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const business = await findBusinessBySlug(slug);
  if (!business) notFound();

  const phone = await verifiedPhoneFor(business.id);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 px-4 py-6 sm:py-8 lg:py-10">
      <div className="overflow-hidden rounded-[2rem] bg-cream-50 shadow-glow-strong ring-1 ring-black/5 sm:rounded-[2.25rem]">
        <div className="border-b border-cream-200 bg-white px-5 py-3.5">
          <a href={`/${slug}`} className="link-back">
            <span aria-hidden>←</span> Voltar
          </a>
          {phone && (
            <div className="mt-2">
              <p className="font-display text-[22px] font-semibold tracking-tight text-ink-900">
                Meus agendamentos
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-ink-500">
                {formatPhone(phone)}
              </p>
            </div>
          )}
        </div>

        <div className="px-5 pb-7 pt-5">
          {phone ? (
            <AuthedList
              slug={slug}
              businessId={business.id}
              phone={phone}
              timezone={business.timezone}
              searchParams={searchParams}
            />
          ) : (
            <AccessForm slug={slug} />
          )}
        </div>
      </div>
    </main>
  );
}

async function AuthedList({
  slug,
  businessId,
  phone,
  timezone,
  searchParams,
}: {
  slug: string;
  businessId: string;
  phone: string;
  timezone: string;
  searchParams: Promise<{ date?: string }>;
}) {
  const date = (await searchParams).date ?? todayLocalDateStr(timezone);
  const appointments = await listMyAppointments(businessId, phone);
  const serviceIds = Array.from(
    new Set(
      appointments
        .filter((appointment) => appointment.status === "CONFIRMED")
        .map((appointment) => appointment.serviceId),
    ),
  );
  const slotGroups = await Promise.all(
    serviceIds.map(async (serviceId) => {
      const slots = await availableSlots(businessId, serviceId, date);
      return slots.map((slot) => ({
        serviceId,
        iso: slot.startAt.toISOString(),
        label: slot.label,
      }));
    }),
  );

  return (
    <AppointmentsList
      slug={slug}
      timezone={timezone}
      rescheduleDate={date}
      slots={slotGroups.flat()}
      appointments={appointments.map((appointment) => ({
        id: appointment.id,
        status: appointment.status,
        serviceName: appointment.serviceNameSnapshot,
        serviceId: appointment.serviceId,
        startAt: appointment.startAt.toISOString(),
        price: appointment.priceSnapshot,
      }))}
    />
  );
}
