"use client";

import { StatusBadge } from "@/components/status-badge";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { useActionState, useState } from "react";
import {
  cancelAction,
  rescheduleAction,
  type RescheduleState,
} from "./actions";

interface Appt {
  id: string;
  status: string;
  serviceName: string;
  serviceId: string;
  startAt: string;
  price: number;
}

interface SlotOption {
  serviceId: string;
  iso: string;
  label: string;
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function AppointmentsList({
  slug,
  timezone,
  rescheduleDate,
  appointments,
  slots,
}: {
  slug: string;
  timezone: string;
  rescheduleDate: string;
  appointments: Appt[];
  slots: SlotOption[];
}) {
  const [reState, reAction, repending] = useActionState<
    RescheduleState | null,
    FormData
  >(rescheduleAction, null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [chosen, setChosen] = useState<Record<string, string>>({});

  if (appointments.length === 0) {
    return (
      <div className="px-3 pb-8 pt-10 text-center">
        <span className="mx-auto mb-5 flex h-21 w-21 items-center justify-center rounded-full bg-gradient-to-br from-brand-50 to-lilac-50 text-brand-300">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-9 w-9"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
            <path d="M12 14v3M10.5 15.5h3" />
          </svg>
        </span>
        <p className="font-display text-xl font-semibold text-ink-900">
          Nada por aqui ainda
        </p>
        <p className="mx-auto mt-2 mb-6 max-w-xs text-sm leading-relaxed text-ink-500">
          Você não tem agendamentos. Que tal reservar um horário agora?
        </p>
        <Link href={`/${slug}`} className="btn-primary inline-flex px-6">
          Ver serviços
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      {appointments.map((appointment) => {
        const options = slots.filter(
          (slot) => slot.serviceId === appointment.serviceId,
        );
        const when = formatInTimeZone(
          new Date(appointment.startAt),
          timezone,
          "EEE, d 'de' MMM '·' HH:mm",
          { locale: ptBR },
        );
        return (
          <div key={appointment.id} className="surface">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[15.5px] font-semibold text-ink-900">
                  {appointment.serviceName}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-medium capitalize text-ink-700">
                  <CalendarIcon className="text-lilac-400" />
                  {when} · R$ {appointment.price}
                </p>
              </div>
              <StatusBadge status={appointment.status} />
            </div>

            {appointment.status === "CONFIRMED" && cancelId !== appointment.id && (
              <div className="mt-3.5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setOpenId(openId === appointment.id ? null : appointment.id)
                  }
                  className="btn-secondary flex-1 border-brand-200 py-2.5 text-brand-700"
                >
                  Remarcar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    setCancelId(appointment.id);
                  }}
                  className="flex-1 rounded-2xl border-[1.5px] border-cream-200 bg-white py-2.5 text-sm font-semibold text-ink-500 transition hover:border-cream-300 hover:text-ink-700"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* confirmação de cancelamento */}
            {cancelId === appointment.id && (
              <div className="surface-muted mt-3.5 border-danger-200 bg-danger-50 p-3.5">
                <div className="mb-2 flex items-center gap-2.5">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-4 w-4 text-danger-600"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span className="font-display text-base font-semibold text-ink-900">
                    Cancelar este agendamento?
                  </span>
                </div>
                <p className="mb-3.5 text-[13.5px] leading-normal capitalize text-ink-500">
                  {appointment.serviceName} · {when}. Essa ação não pode ser
                  desfeita.
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCancelId(null)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Voltar
                  </button>
                  <form action={cancelAction} className="flex-1">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <button className="btn-danger w-full py-3">
                      Sim, cancelar
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* remarcar */}
            {appointment.status === "CONFIRMED" && openId === appointment.id && (
              <div className="surface-muted mt-3.5 space-y-3 p-3.5">
                <form className="flex items-end gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`date-${appointment.id}`}
                      className="mb-1.5 block text-[13px] font-semibold text-ink-700"
                    >
                      Nova data
                    </label>
                    <input
                      id={`date-${appointment.id}`}
                      type="date"
                      name="date"
                      defaultValue={rescheduleDate}
                      className="input"
                    />
                  </div>
                  <button className="btn-secondary">Ver horários</button>
                </form>

                <form action={reAction} className="space-y-2.5">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={appointment.id} />
                  <input
                    type="hidden"
                    name="startAt"
                    value={chosen[appointment.id] ?? ""}
                  />
                  {options.length === 0 ? (
                    <p className="text-[13px] text-ink-500">
                      Sem horários disponíveis nessa data.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 gap-2.5">
                      {options.map((slot) => {
                        const active = chosen[appointment.id] === slot.iso;
                        return (
                          <button
                            key={slot.iso}
                            type="button"
                            onClick={() =>
                              setChosen((current) => ({
                                ...current,
                                [appointment.id]: slot.iso,
                              }))
                            }
                            aria-pressed={active}
                            className={`rounded-2xl py-2.5 text-center text-sm font-semibold transition ${
                              active ? "chip-selected" : "chip"
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <button
                    disabled={repending || !chosen[appointment.id]}
                    className="btn-primary w-full"
                  >
                    {repending ? "Remarcando..." : "Confirmar remarcação"}
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
      {reState?.error && <p className="alert-error">{reState.error}</p>}
      {reState?.ok && (
        <p className="alert-success">Agendamento remarcado.</p>
      )}
    </div>
  );
}
