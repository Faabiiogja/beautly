"use client";

import { OtpInput } from "@/components/otp-input";
import { PhoneField } from "@/components/phone-field";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import {
  confirmAction,
  sendCodeAction,
  type ConfirmState,
  type SendCodeState,
} from "./actions";

interface Day {
  value: string;
  weekday: string;
  day: string;
}

interface Props {
  slug: string;
  serviceId: string;
  selectedDate: string;
  monthLabel: string;
  selectedLabel: string;
  days: Day[];
  slots: { iso: string; label: string }[];
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5">
      <span className="gradient-brand flex h-7 w-7 items-center justify-center rounded-full font-display text-sm font-bold text-white">
        {n}
      </span>
      <h2 className="font-display text-[17px] font-semibold text-ink-900">
        {title}
      </h2>
    </div>
  );
}

export function BookingForm({
  slug,
  serviceId,
  selectedDate,
  monthLabel,
  selectedLabel,
  days,
  slots,
}: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<{ iso: string; label: string } | null>(
    null,
  );
  const [phone, setPhone] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [sendState, sendAction, sending] = useActionState<
    SendCodeState | null,
    FormData
  >(sendCodeAction, null);
  const [confirmState, confirmFormAction, confirming] = useActionState<
    ConfirmState | null,
    FormData
  >(confirmAction, null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function selectDate(value: string) {
    setChosen(null);
    router.push(`/${slug}/agendar?serviceId=${serviceId}&date=${value}`);
  }

  function requestCode() {
    const form = new FormData();
    form.set("slug", slug);
    form.set("phone", phone);
    sendAction(form);
    setCooldown(60);
  }

  const phoneReady = phone.replace(/\D/g, "").length >= 10;
  const cooldownLabel = `${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, "0")}`;

  return (
    <div className="space-y-6">
      {/* PASSO 1 — data e horário */}
      <section>
        <StepHeader n={1} title="Escolha data e horário" />
        <div className="surface">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold capitalize text-ink-700">
              {monthLabel}
            </span>
            <span className="text-xs font-medium text-lilac-500">
              próximos 15 dias
            </span>
          </div>

          <div className="-mx-1 mb-4 flex gap-2.5 overflow-x-auto px-1 pb-1.5">
            {days.map((d) => {
              const active = d.value === selectedDate;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => selectDate(d.value)}
                  aria-pressed={active}
                  className={`w-[52px] shrink-0 rounded-2xl py-2.5 text-center transition ${
                    active ? "chip-selected" : "chip"
                  }`}
                >
                  <span
                    className={`block text-[11px] font-bold tracking-wide ${active ? "opacity-90" : ""}`}
                  >
                    {d.weekday}
                  </span>
                  <span className="font-display mt-0.5 block text-lg font-semibold">
                    {d.day}
                  </span>
                </button>
              );
            })}
          </div>

          {slots.length === 0 ? (
            <div className="px-3 pb-3.5 pt-6 text-center">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cream-100 text-lilac-500">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-6 w-6"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                  <path d="M9 15l6 4M15 15l-6 4" opacity=".6" />
                </svg>
              </span>
              <p className="text-[15px] font-semibold text-ink-700">
                Sem horários neste dia
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
                Não há horários disponíveis nesta data. Tente outro dia.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2.5 text-[13px] font-semibold capitalize text-ink-700">
                Horários — {selectedLabel}
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                {slots.map((slot) => {
                  const active = chosen?.iso === slot.iso;
                  return (
                    <button
                      key={slot.iso}
                      type="button"
                      onClick={() => setChosen(slot)}
                      aria-pressed={active}
                      className={`rounded-2xl py-3 text-center text-sm font-semibold transition ${
                        active ? "chip-selected" : "chip"
                      }`}
                    >
                      {slot.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <form action={confirmFormAction} className="space-y-6">
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="serviceId" value={serviceId} />
        <input type="hidden" name="startAt" value={chosen?.iso ?? ""} />

        {/* PASSO 2 — telefone */}
        <section>
          <StepHeader n={2} title="Seu telefone" />
          <div className="surface">
            <label
              htmlFor="customerName"
              className="mb-2 block text-[13px] font-semibold text-ink-700"
            >
              Seu nome
            </label>
            <input
              id="customerName"
              name="customerName"
              placeholder="Maria da Silva"
              required
              className="mb-3.5 w-full rounded-2xl border-[1.5px] border-brand-200 bg-cream-50 px-4 py-3.5 text-base font-medium text-ink-900 placeholder:font-normal placeholder:text-ink-500 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100"
            />

            <label
              htmlFor="phone"
              className="mb-2 block text-[13px] font-semibold text-ink-700"
            >
              Número com DDD
            </label>
            <div className="mb-3.5">
              <PhoneField
                id="phone"
                placeholder="(11) 95555-0184"
                value={phone}
                onChange={setPhone}
              />
            </div>

            <button
              type="button"
              disabled={sending || !phoneReady || cooldown > 0}
              onClick={requestCode}
              className="btn-primary w-full"
            >
              {sending ? "Enviando..." : "Enviar código"}
            </button>

            {sendState?.error && (
              <p className="alert-error mt-3">{sendState.error}</p>
            )}
            {sendState?.sent ? (
              <p className="mt-3 text-center text-[12.5px] leading-snug text-success-700">
                Código enviado! Confira seu SMS ou WhatsApp.
              </p>
            ) : (
              <p className="mt-3 text-center text-[12.5px] leading-snug text-ink-500">
                Enviaremos um código por SMS ou WhatsApp para confirmar seu
                agendamento.
              </p>
            )}
          </div>
        </section>

        {/* PASSO 3 — código */}
        <section>
          <StepHeader n={3} title="Confirme o código" />
          <div className="surface">
            <p className="mb-3.5 text-[13.5px] leading-normal text-ink-700">
              Digite o código de 6 dígitos enviado para o seu telefone.
            </p>

            <div className="mb-3.5">
              <OtpInput invalid={Boolean(confirmState?.error)} />
            </div>

            {confirmState?.error && (
              <div className="alert-error mb-4 flex items-start gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span className="text-[13px] font-medium leading-snug">
                  {confirmState.error}
                </span>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-ink-500">Não recebeu?</span>
              {cooldown > 0 ? (
                <span className="text-[13px] font-semibold text-lilac-500">
                  Reenviar em {cooldownLabel}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={sending || !phoneReady}
                  onClick={requestCode}
                  className="text-[13px] font-bold text-brand-700 disabled:opacity-50"
                >
                  Reenviar código
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={confirming || !chosen}
              className="btn-primary w-full"
            >
              {confirming ? "Confirmando..." : "Confirmar agendamento"}
            </button>
            {!chosen && (
              <p className="mt-2.5 text-center text-[12.5px] text-ink-500">
                Escolha um horário no passo 1 para confirmar.
              </p>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
