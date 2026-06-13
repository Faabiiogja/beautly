import { ConfirmButton } from "@/components/confirm-button";
import { requireProfessional } from "@/lib/auth-guard";
import { formatPhone, whatsappLink } from "@/lib/phone";
import {
  isDayClosed,
  listAppointmentsByDay,
} from "@/services/agenda-service";
import { getBusiness } from "@/services/business-service";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";
import {
  cancelAppointmentAction,
  closeDayAction,
  reopenDayAction,
} from "./actions";

function shiftDate(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days, 12)).toISOString().slice(0, 10);
}

function formatDateBr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

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
    <main>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-zinc-900">
          Agenda
        </h1>
        <form className="flex items-center gap-2">
          <label htmlFor="agenda-date" className="sr-only">
            Data
          </label>
          <input
            id="agenda-date"
            type="date"
            name="date"
            defaultValue={date}
            className="input w-auto"
          />
          <button className="btn-secondary">Ver</button>
        </form>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Link
          href={`/admin/agenda?date=${shiftDate(date, -1)}`}
          className="btn-secondary py-1.5 text-xs"
        >
          ← Dia anterior
        </Link>
        <p className="text-sm font-medium text-zinc-700">
          {formatDateBr(date)}
          {date === today && (
            <span className="badge ml-2 bg-brand-100 text-brand-700">hoje</span>
          )}
        </p>
        <Link
          href={`/admin/agenda?date=${shiftDate(date, 1)}`}
          className="btn-secondary py-1.5 text-xs"
        >
          Próximo dia →
        </Link>
      </div>

      <div className="card mt-4 flex items-center justify-between gap-3 p-4">
        {closed ? (
          <>
            <span className="badge bg-red-100 text-red-700">Dia fechado</span>
            <form action={reopenDayAction}>
              <input type="hidden" name="date" value={date} />
              <button className="btn-secondary py-1.5 text-xs">
                Reabrir dia
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-600">
              Não vai atender neste dia? Feche para bloquear novos agendamentos.
            </p>
            <form action={closeDayAction}>
              <input type="hidden" name="date" value={date} />
              <ConfirmButton
                message="Fechar este dia? Agendamentos já existentes não serão cancelados automaticamente."
                className="btn-secondary whitespace-nowrap py-1.5 text-xs"
              >
                Fechar dia
              </ConfirmButton>
            </form>
          </>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {appointments.map((appointment) => (
          <li
            key={appointment.id}
            className="card flex items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="font-medium text-zinc-900">
                {formatInTimeZone(appointment.startAt, tz, "HH:mm")} ·{" "}
                {appointment.serviceNameSnapshot}
              </p>
              <p className="mt-0.5 truncate text-sm text-zinc-500">
                {appointment.customerName} ·{" "}
                <a
                  href={whatsappLink(appointment.customerPhone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-700 hover:underline"
                >
                  {formatPhone(appointment.customerPhone)}
                </a>{" "}
                · R$ {appointment.priceSnapshot}
              </p>
            </div>
            <form action={cancelAppointmentAction}>
              <input type="hidden" name="id" value={appointment.id} />
              <ConfirmButton
                message={`Cancelar o atendimento de ${appointment.customerName}? Avise a cliente pelo WhatsApp.`}
                className="btn-secondary whitespace-nowrap py-1.5 text-xs text-red-600 hover:border-red-300 hover:text-red-700"
              >
                Cancelar
              </ConfirmButton>
            </form>
          </li>
        ))}
        {appointments.length === 0 && (
          <li className="alert-info">Nenhum agendamento neste dia.</li>
        )}
      </ul>
    </main>
  );
}
