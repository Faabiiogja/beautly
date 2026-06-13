"use client";

import { formatInTimeZone } from "date-fns-tz";
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

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELED_BY_CLIENT: "Cancelado por voce",
  CANCELED_BY_PROFESSIONAL: "Cancelado pela profissional",
  RESCHEDULED: "Reagendado",
};

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
    return <p className="text-sm text-gray-500">Voce ainda nao tem agendamentos.</p>;
  }

  return (
    <div className="space-y-4">
      <form className="flex items-center gap-2">
        <label className="text-sm">Data para remarcar</label>
        <input
          type="date"
          name="date"
          defaultValue={rescheduleDate}
          className="rounded border p-1"
        />
        <button className="rounded border px-2 py-1 text-sm">Ver horarios</button>
      </form>

      <ul className="space-y-3">
        {appointments.map((appointment) => {
          const options = slots.filter((slot) => slot.serviceId === appointment.serviceId);
          return (
            <li key={appointment.id} className="rounded border p-3">
              <p className="font-medium">{appointment.serviceName}</p>
              <p className="text-sm text-gray-500">
                {formatInTimeZone(new Date(appointment.startAt), timezone, "dd/MM/yyyy 'as' HH:mm")} · R${" "}
                {appointment.price}
              </p>
              <p className="mt-1 text-xs">
                {STATUS_LABEL[appointment.status] ?? appointment.status}
              </p>

              {appointment.status === "CONFIRMED" && (
                <div className="mt-2 flex flex-col gap-2">
                  <form action={cancelAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="id" value={appointment.id} />
                    <button className="text-sm text-red-600 underline">Cancelar</button>
                  </form>

                  <button
                    type="button"
                    onClick={() => setOpenId(openId === appointment.id ? null : appointment.id)}
                    className="text-left text-sm underline"
                  >
                    Remarcar
                  </button>

                  {openId === appointment.id && (
                    <form action={reAction} className="space-y-2">
                      <input type="hidden" name="slug" value={slug} />
                      <input type="hidden" name="id" value={appointment.id} />
                      <input
                        type="hidden"
                        name="startAt"
                        value={chosen[appointment.id] ?? ""}
                      />
                      {options.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Sem horarios disponiveis nessa data.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
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
                              className={`rounded border px-2 py-1 text-xs ${
                                chosen[appointment.id] === slot.iso
                                  ? "bg-black text-white"
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
                        className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                      >
                        Confirmar remarcacao
                      </button>
                    </form>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {reState?.error && <p className="text-sm text-red-600">{reState.error}</p>}
      {reState?.ok && <p className="text-sm text-green-600">Agendamento remarcado.</p>}
    </div>
  );
}
