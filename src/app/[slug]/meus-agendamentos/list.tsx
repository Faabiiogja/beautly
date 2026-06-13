"use client";

import { formatInTimeZone } from "date-fns-tz";
import { useActionState, useState } from "react";
import {
  cancelAction,
  rescheduleAction,
  type RescheduleState,
} from "./actions";
import { StatusBadge } from "@/components/status-badge";

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
  const [chosen, setChosen] = useState<Record<string, string>>({});

  if (appointments.length === 0) {
    return (
      <p className="alert-info">
        Você ainda não tem agendamentos com este telefone.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {appointments.map((appointment) => {
          const options = slots.filter(
            (slot) => slot.serviceId === appointment.serviceId,
          );
          return (
            <li key={appointment.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-zinc-900">
                    {appointment.serviceName}
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500">
                    {formatInTimeZone(
                      new Date(appointment.startAt),
                      timezone,
                      "dd/MM/yyyy 'às' HH:mm",
                    )}{" "}
                    · R$ {appointment.price}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>

              {appointment.status === "CONFIRMED" && (
                <div className="mt-3 flex gap-2 border-t border-zinc-100 pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenId(openId === appointment.id ? null : appointment.id)
                    }
                    className="btn-secondary flex-1 py-2 text-xs"
                  >
                    Remarcar
                  </button>
                  <form
                    action={cancelAction}
                    className="flex-1"
                    onSubmit={(event) => {
                      if (!confirm("Cancelar este agendamento?")) {
                        event.preventDefault();
                      }
                    }}
                  >
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <button className="btn-secondary w-full py-2 text-xs text-red-600 hover:border-red-300 hover:text-red-700">
                      Cancelar
                    </button>
                  </form>
                </div>
              )}

              {appointment.status === "CONFIRMED" && openId === appointment.id && (
                <div className="mt-3 space-y-3 rounded-xl bg-zinc-50 p-3">
                  <form className="flex items-end gap-2">
                    <div className="flex-1">
                      <label
                        htmlFor={`date-${appointment.id}`}
                        className="field-label"
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

                  <form action={reAction} className="space-y-2">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <input
                      type="hidden"
                      name="startAt"
                      value={chosen[appointment.id] ?? ""}
                    />
                    {options.length === 0 ? (
                      <p className="text-xs text-zinc-500">
                        Sem horários disponíveis nessa data.
                      </p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {options.map((slot) => (
                          <button
                            key={slot.iso}
                            type="button"
                            onClick={() =>
                              setChosen((current) => ({
                                ...current,
                                [appointment.id]: slot.iso,
                              }))
                            }
                            aria-pressed={chosen[appointment.id] === slot.iso}
                            className={`chip px-2 py-1.5 text-xs ${
                              chosen[appointment.id] === slot.iso
                                ? "chip-selected"
                                : ""
                            }`}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <button
                      disabled={repending || !chosen[appointment.id]}
                      className="btn-primary w-full py-2 text-xs"
                    >
                      {repending ? "Remarcando..." : "Confirmar remarcação"}
                    </button>
                  </form>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {reState?.error && <p className="alert-error">{reState.error}</p>}
      {reState?.ok && <p className="alert-success">Agendamento remarcado.</p>}
    </div>
  );
}
