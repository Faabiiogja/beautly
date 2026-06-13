"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  confirmAction,
  sendCodeAction,
  type ConfirmState,
  type SendCodeState,
} from "./actions";

interface Props {
  slug: string;
  serviceId: string;
  selectedDate: string;
  minDate: string;
  maxDate: string;
  slots: { iso: string; label: string }[];
}

function formatDateBr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function BookingForm({
  slug,
  serviceId,
  selectedDate,
  minDate,
  maxDate,
  slots,
}: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<{ iso: string; label: string } | null>(
    null,
  );
  const [phone, setPhone] = useState("");
  const [sendState, sendAction, sending] = useActionState<
    SendCodeState | null,
    FormData
  >(sendCodeAction, null);
  const [confirmState, confirmFormAction, confirming] = useActionState<
    ConfirmState | null,
    FormData
  >(confirmAction, null);

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          1 · Escolha data e horário
        </h2>
        <div>
          <label htmlFor="booking-date" className="field-label">
            Data
          </label>
          <input
            id="booking-date"
            type="date"
            defaultValue={selectedDate}
            min={minDate}
            max={maxDate}
            onChange={(event) => {
              setChosen(null);
              router.push(
                `/${slug}/agendar?serviceId=${serviceId}&date=${event.target.value}`,
              );
            }}
            className="input"
          />
        </div>

        <div>
          <p className="field-label">Horários disponíveis</p>
          {slots.length === 0 ? (
            <p className="alert-info">
              Não há horários disponíveis para este serviço nesta data. Tente
              outro dia.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((slot) => (
                <button
                  key={slot.iso}
                  type="button"
                  onClick={() => setChosen(slot)}
                  aria-pressed={chosen?.iso === slot.iso}
                  className={`chip ${chosen?.iso === slot.iso ? "chip-selected" : ""}`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {chosen && (
        <form action={confirmFormAction} className="card space-y-4 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            2 · Seus dados
          </h2>
          <p className="alert-info">
            {formatDateBr(selectedDate)} às {chosen.label}
          </p>

          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="startAt" value={chosen.iso} />

          <div>
            <label htmlFor="customerName" className="field-label">
              Seu nome
            </label>
            <input
              id="customerName"
              name="customerName"
              placeholder="Maria da Silva"
              required
              className="input"
            />
          </div>

          <div>
            <label htmlFor="phone" className="field-label">
              Telefone (WhatsApp)
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              placeholder="(11) 99999-8888"
              required
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="input"
            />
          </div>

          <button
            type="button"
            disabled={sending || phone.replace(/\D/g, "").length < 10}
            onClick={() => {
              const form = new FormData();
              form.set("slug", slug);
              form.set("phone", phone);
              sendAction(form);
            }}
            className="btn-secondary w-full"
          >
            {sending ? "Enviando..." : "Receber código por telefone"}
          </button>
          {sendState?.error && <p className="alert-error">{sendState.error}</p>}
          {sendState?.sent && (
            <p className="alert-success">
              Código enviado! Confira seu telefone e digite abaixo.
            </p>
          )}

          <div>
            <label htmlFor="code" className="field-label">
              Código de confirmação
            </label>
            <input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              required
              className="input"
            />
          </div>

          {confirmState?.error && (
            <p className="alert-error">{confirmState.error}</p>
          )}
          <button type="submit" disabled={confirming} className="btn-primary w-full">
            {confirming ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </form>
      )}
    </div>
  );
}
