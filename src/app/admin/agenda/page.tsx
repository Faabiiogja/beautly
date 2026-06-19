import { ConfirmForm } from "@/components/confirm-form";
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
        <h1 className="page-title">Agenda</h1>
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
        <p className="text-sm font-medium text-ink-700">
          {formatDateBr(date)}
          {date === today && (
            <span className="badge badge-brand ml-2">hoje</span>
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
            <span className="badge badge-danger">Dia fechado</span>
            <form action={reopenDayAction}>
              <input type="hidden" name="date" value={date} />
              <button className="btn-secondary py-1.5 text-xs">
                Reabrir dia
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="text-sm text-ink-500">
              Não vai atender neste dia? Feche para bloquear novos agendamentos.
            </p>
            <ConfirmForm
              action={closeDayAction}
              title="Fechar este dia?"
              description="Agendamentos já existentes não serão cancelados automaticamente."
              confirmLabel="Fechar dia"
              danger
              trigger={
                <button className="btn-secondary whitespace-nowrap py-1.5 text-xs">
                  Fechar dia
                </button>
              }
            >
              <input type="hidden" name="date" value={date} />
            </ConfirmForm>
          </>
        )}
      </div>

      <ul className="mt-6 space-y-3">
        {appointments.map((appointment) => (
          <li key={appointment.id} className="card flex items-center justify-between gap-3 p-4">
            <div className="min-w-0">
              <p className="font-medium text-ink-900">
                {formatInTimeZone(appointment.startAt, tz, "HH:mm")} ·{" "}
                {appointment.serviceNameSnapshot}
              </p>
              <p className="mt-0.5 truncate text-sm text-ink-500">
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
            <ConfirmForm
              action={cancelAppointmentAction}
              title="Cancelar o atendimento?"
              description={`Avisaremos a ${appointment.customerName}? Recomendamos avisar a cliente pelo WhatsApp.`}
              confirmLabel="Sim, cancelar"
              cancelLabel="Voltar"
              danger
              trigger={
                <button className="btn-secondary whitespace-nowrap py-1.5 text-xs text-danger-700 hover:border-danger-300">
                  Cancelar
                </button>
              }
            >
              <input type="hidden" name="id" value={appointment.id} />
            </ConfirmForm>
          </li>
        ))}
        {appointments.length === 0 && (
          <li className="alert-info">Nenhum agendamento neste dia.</li>
        )}
      </ul>
    </main>
  );
}
