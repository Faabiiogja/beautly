import { verifiedPhoneFor } from "@/lib/client-session";
import { todayLocalDateStr } from "@/lib/timezone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import { listMyAppointments } from "@/services/booking-service";
import Link from "next/link";
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
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <Link
        href={`/${slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-700"
      >
        ← Voltar para {business.name}
      </Link>
      <h1 className="font-display mb-6 text-2xl font-semibold text-zinc-900">
        Meus agendamentos
      </h1>

      {phone ? (
        <AuthedList slug={slug} businessId={business.id} phone={phone} timezone={business.timezone} searchParams={searchParams} />
      ) : (
        <AccessForm slug={slug} />
      )}
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
