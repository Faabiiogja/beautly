"use client";

import { useActionState } from "react";
import { saveHoursAction, type HoursState } from "./actions";

const NAMES = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

interface Row {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export function HoursForm({ hours }: { hours: Row[] }) {
  const [state, action, pending] = useActionState<HoursState | null, FormData>(
    saveHoursAction,
    null,
  );

  return (
    <form action={action} className="card mt-6 space-y-1 p-5">
      {hours.map((hour) => (
        <div
          key={hour.weekday}
          className="flex flex-wrap items-center gap-3 rounded-2xl px-2 py-2.5 transition hover:bg-cream-50"
        >
          <label className="flex w-32 cursor-pointer items-center gap-2 text-sm font-medium text-ink-900">
            <input
              type="checkbox"
              name={`open-${hour.weekday}`}
              defaultChecked={hour.isOpen}
              className="h-4 w-4 rounded accent-brand-600"
            />
            {NAMES[hour.weekday]}
          </label>
          <div className="flex items-center gap-2 text-sm text-ink-500">
            <label className="sr-only" htmlFor={`start-${hour.weekday}`}>
              Início {NAMES[hour.weekday]}
            </label>
            <input
              id={`start-${hour.weekday}`}
              type="time"
              name={`start-${hour.weekday}`}
              defaultValue={hour.startTime}
              className="input w-auto py-1.5"
            />
            <span>até</span>
            <label className="sr-only" htmlFor={`end-${hour.weekday}`}>
              Fim {NAMES[hour.weekday]}
            </label>
            <input
              id={`end-${hour.weekday}`}
              type="time"
              name={`end-${hour.weekday}`}
              defaultValue={hour.endTime}
              className="input w-auto py-1.5"
            />
          </div>
        </div>
      ))}
      {state?.error && <p className="alert-error mt-3">{state.error}</p>}
      {state?.ok && <p className="alert-success mt-3">Horários salvos.</p>}
      <div className="pt-3">
        <button disabled={pending} className="btn-primary">
          {pending ? "Salvando..." : "Salvar horários"}
        </button>
      </div>
    </form>
  );
}
