import { verifiedPhoneFor } from "@/lib/client-session";
import { formatPhone } from "@/lib/phone";
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
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="overflow-hidden rounded-[32px] bg-[#faf8fb] shadow-[0_30px_60px_-30px_rgba(157,23,77,0.35)] ring-1 ring-black/5">
        <div className="border-b border-[#f1ebf2] bg-white px-5 py-3.5">
          <Link
            href={`/${slug}`}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#9b6aa0]"
          >
            ← Voltar
          </Link>
          {phone && (
            <div className="mt-2">
              <p className="font-display text-[22px] font-semibold text-[#2c1f29]">
                Meus agendamentos
              </p>
              <p className="mt-0.5 text-[13px] font-medium text-[#9b8a98]">
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
