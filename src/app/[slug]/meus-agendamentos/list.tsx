"use client";

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

const STATUS_PILL: Record<string, string> = {
  CONFIRMED: "text-[#16a34a] bg-[#e7f7ed] border-[#bfe9cd]",
  CANCELED_BY_CLIENT: "text-[#8a7f94] bg-[#f3eff4] border-[#e7e0ec]",
  CANCELED_BY_PROFESSIONAL: "text-[#b91c1c] bg-[#fef2f3] border-[#f6cdd2]",
  RESCHEDULED: "text-[#7c53d6] bg-[#f1ebfb] border-[#ddd0f4]",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELED_BY_CLIENT: "Cancelado por você",
  CANCELED_BY_PROFESSIONAL: "Cancelado pela profissional",
  RESCHEDULED: "Remarcado",
};

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
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
        <span className="mx-auto mb-5 flex h-21 w-21 items-center justify-center rounded-full bg-gradient-to-br from-[#fdeef7] to-[#f3ecfb]">
          <svg
            width="38"
            height="38"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dca6cd"
            strokeWidth="1.8"
            aria-hidden
          >
            <rect x="3" y="5" width="18" height="16" rx="3" />
            <path d="M3 10h18M8 3v4M16 3v4" />
            <path d="M12 14v3M10.5 15.5h3" stroke="#c98fbf" />
          </svg>
        </span>
        <p className="font-display text-xl font-semibold text-[#2c1f29]">
          Nada por aqui ainda
        </p>
        <p className="mx-auto mt-2 mb-6 max-w-xs text-sm leading-relaxed text-[#8a7f94]">
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
          <div
            key={appointment.id}
            className="rounded-[22px] border border-[#f0e6ee] bg-white p-4 shadow-[0_4px_14px_-8px_rgba(157,23,77,0.16)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-[15.5px] font-semibold text-[#2c1f29]">
                  {appointment.serviceName}
                </p>
                <p className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-medium capitalize text-[#574a54]">
                  <CalendarIcon className="text-[#b09cb6]" />
                  {when} · R$ {appointment.price}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${
                  STATUS_PILL[appointment.status] ??
                  "border-[#f3d9ec] bg-[#fcf2f8] text-[#be185d]"
                }`}
              >
                {STATUS_LABEL[appointment.status] ?? appointment.status}
              </span>
            </div>

            {appointment.status === "CONFIRMED" && cancelId !== appointment.id && (
              <div className="mt-3.5 flex gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    setOpenId(openId === appointment.id ? null : appointment.id)
                  }
                  className="flex-1 rounded-[13px] border-[1.5px] border-[#f3d3e7] bg-white py-2.5 text-sm font-semibold text-[#be185d]"
                >
                  Remarcar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOpenId(null);
                    setCancelId(appointment.id);
                  }}
                  className="flex-1 rounded-[13px] border-[1.5px] border-[#ece3ec] bg-white py-2.5 text-sm font-semibold text-[#8a7f94]"
                >
                  Cancelar
                </button>
              </div>
            )}

            {/* confirmação de cancelamento */}
            {cancelId === appointment.id && (
              <div className="mt-3.5 rounded-[16px] border border-[#f6cdd2] bg-[#fffafa] p-3.5">
                <div className="mb-2 flex items-center gap-2.5">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="2"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                  <span className="font-display text-base font-semibold text-[#2c1f29]">
                    Cancelar este agendamento?
                  </span>
                </div>
                <p className="mb-3.5 text-[13.5px] leading-normal capitalize text-[#8a7f94]">
                  {appointment.serviceName} · {when}. Essa ação não pode ser
                  desfeita.
                </p>
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setCancelId(null)}
                    className="flex-1 rounded-[13px] border-[1.5px] border-[#ece3ec] bg-white py-3 text-sm font-semibold text-[#574a54]"
                  >
                    Voltar
                  </button>
                  <form action={cancelAction} className="flex-1">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <button className="w-full rounded-[13px] bg-[#dc2626] py-3 text-sm font-semibold text-white">
                      Sim, cancelar
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* remarcar */}
            {appointment.status === "CONFIRMED" && openId === appointment.id && (
              <div className="mt-3.5 space-y-3 rounded-[16px] bg-[#faf6fb] p-3.5">
                <form className="flex items-end gap-2">
                  <div className="flex-1">
                    <label
                      htmlFor={`date-${appointment.id}`}
                      className="mb-1.5 block text-[13px] font-semibold text-[#574a54]"
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
                    <p className="text-[13px] text-[#a394aa]">
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
                            className={`rounded-[13px] py-2.5 text-center text-sm font-semibold transition ${
                              active
                                ? "gradient-brand text-white shadow-[0_8px_16px_-8px_rgba(236,72,153,0.6)]"
                                : "border border-[#ecdfeb] bg-white text-[#574a54]"
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
