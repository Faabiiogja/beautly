import { requireProfessional } from "@/lib/auth-guard";
import {
  isDayClosed,
  listAppointmentsByDay,
} from "@/services/agenda-service";
import { getBusiness } from "@/services/business-service";
import { formatInTimeZone } from "date-fns-tz";
import {
  cancelAppointmentAction,
  closeDayAction,
  reopenDayAction,
} from "./actions";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  const tz = business.timezone;
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const date = (await searchParams).date ?? today;

  const appointments = await listAppointmentsByDay(business.id, date, tz);
  const closed = await isDayClosed(business.id, date);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Agenda</h1>
      <form className="mb-6 flex items-center gap-2">
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="rounded border p-2"
        />
        <button className="rounded border px-3 py-2 text-sm">Ver</button>
      </form>

      <div className="mb-4">
        {closed ? (
          <form action={reopenDayAction}>
            <input type="hidden" name="date" value={date} />
            <span className="mr-3 rounded bg-red-100 px-2 py-1 text-sm">
              Dia fechado
            </span>
            <button className="text-sm underline">Reabrir dia</button>
          </form>
        ) : (
          <form action={closeDayAction}>
            <input type="hidden" name="date" value={date} />
            <button className="text-sm underline">Fechar este dia</button>
          </form>
        )}
      </div>

      <ul className="space-y-3">
        {appointments.map((appointment) => (
          <li
            key={appointment.id}
            className="flex items-center justify-between rounded border p-3"
          >
            <div>
              <p className="font-medium">
                {formatInTimeZone(appointment.startAt, tz, "HH:mm")} ·{" "}
                {appointment.serviceNameSnapshot}
              </p>
              <p className="text-sm text-gray-500">
                {appointment.customerName} · {appointment.customerPhone} · R${" "}
                {appointment.priceSnapshot}
              </p>
            </div>
            <form action={cancelAppointmentAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <button className="text-sm text-red-600 underline">
                Cancelar
              </button>
            </form>
          </li>
        ))}
        {appointments.length === 0 && (
          <li className="text-sm text-gray-500">
            Nenhum agendamento neste dia.
          </li>
        )}
      </ul>
    </main>
  );
}
