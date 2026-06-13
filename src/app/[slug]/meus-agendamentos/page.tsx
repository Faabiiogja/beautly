import { verifiedPhoneFor } from "@/lib/client-session";
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
  if (!phone) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="mb-6 text-xl font-semibold">Meus agendamentos</h1>
        <AccessForm slug={slug} />
      </main>
    );
  }

  const date = (await searchParams).date ?? todayLocalDateStr(business.timezone);
  const appointments = await listMyAppointments(business.id, phone);
  const serviceIds = Array.from(
    new Set(
      appointments
        .filter((appointment) => appointment.status === "CONFIRMED")
        .map((appointment) => appointment.serviceId),
    ),
  );
  const slotGroups = await Promise.all(
    serviceIds.map(async (serviceId) => {
      const slots = await availableSlots(business.id, serviceId, date);
      return slots.map((slot) => ({
        serviceId,
        iso: slot.startAt.toISOString(),
        label: slot.label,
      }));
    }),
  );

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Meus agendamentos</h1>
      <AppointmentsList
        slug={slug}
        timezone={business.timezone}
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
    </main>
  );
}
