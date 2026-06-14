"use client";

import { OtpInput } from "@/components/otp-input";
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
      <span className="gradient-brand flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold text-white">
        {n}
      </span>
      <h2 className="font-display text-[17px] font-semibold text-[#2c1f29]">
        {title}
      </h2>
    </div>
  );
}

const cardClass =
  "rounded-[22px] border border-[#f0e6ee] bg-white p-4 shadow-[0_4px_14px_-8px_rgba(157,23,77,0.16)]";

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
        <div className={cardClass}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-[#574a54]">
              {monthLabel}
            </span>
            <span className="text-xs font-medium text-[#b09cb6]">
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
                  className={`w-[52px] shrink-0 rounded-[15px] py-2.5 text-center transition ${
                    active
                      ? "gradient-brand text-white shadow-[0_8px_18px_-8px_rgba(236,72,153,0.6)]"
                      : "border border-[#ecdfeb] bg-white text-[#574a54]"
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
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f6f1f8]">
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c3a9cf"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                  <path d="M9 15l6 4M15 15l-6 4" opacity=".6" />
                </svg>
              </span>
              <p className="text-[15px] font-semibold text-[#574a54]">
                Sem horários neste dia
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#a394aa]">
                Não há horários disponíveis nesta data. Tente outro dia.
              </p>
            </div>
          ) : (
            <>
              <p className="mb-2.5 text-[13px] font-semibold capitalize text-[#574a54]">
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
                      className={`rounded-[13px] py-3 text-center text-sm font-semibold transition ${
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
          <div className={cardClass}>
            <label
              htmlFor="customerName"
              className="mb-2 block text-[13px] font-semibold text-[#574a54]"
            >
              Seu nome
            </label>
            <input
              id="customerName"
              name="customerName"
              placeholder="Maria da Silva"
              required
              className="mb-3.5 w-full rounded-[14px] border-[1.5px] border-[#ecdfeb] bg-[#faf6fb] px-4 py-3.5 text-base font-medium text-[#2c1f29] placeholder:font-normal placeholder:text-[#b6a7bd] focus:border-[#ec4899] focus:outline-none focus:ring-4 focus:ring-[#ec4899]/12"
            />

            <label
              htmlFor="phone"
              className="mb-2 block text-[13px] font-semibold text-[#574a54]"
            >
              Número com DDD
            </label>
            <div className="mb-3.5 flex items-center gap-2.5 rounded-[14px] border-[1.5px] border-[#ecdfeb] bg-[#faf6fb] px-4 py-1 focus-within:border-[#ec4899] focus-within:ring-4 focus-within:ring-[#ec4899]/12">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#b09cb6"
                strokeWidth="2"
                aria-hidden
              >
                <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
              </svg>
              <input
                id="phone"
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="(11) 95555-0184"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                className="w-full bg-transparent py-2.5 text-base font-semibold text-[#2c1f29] placeholder:font-normal placeholder:text-[#b6a7bd] focus:outline-none"
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
              <p className="mt-3 text-center text-[12.5px] leading-snug text-emerald-600">
                Código enviado! Confira seu SMS ou WhatsApp.
              </p>
            ) : (
              <p className="mt-3 text-center text-[12.5px] leading-snug text-[#a394aa]">
                Enviaremos um código por SMS ou WhatsApp para confirmar seu
                agendamento.
              </p>
            )}
          </div>
        </section>

        {/* PASSO 3 — código */}
        <section>
          <StepHeader n={3} title="Confirme o código" />
          <div className={cardClass}>
            <p className="mb-3.5 text-[13.5px] leading-normal text-[#574a54]">
              Digite o código de 6 dígitos enviado para o seu telefone.
            </p>

            <div className="mb-3.5">
              <OtpInput invalid={Boolean(confirmState?.error)} />
            </div>

            {confirmState?.error && (
              <div className="mb-4 flex items-start gap-2.5 rounded-[13px] border border-[#f6cdd2] bg-[#fef2f3] px-3.5 py-3">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#dc2626"
                  strokeWidth="2"
                  className="mt-0.5 shrink-0"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span className="text-[13px] font-medium leading-snug text-[#b91c1c]">
                  {confirmState.error}
                </span>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <span className="text-[13px] text-[#a394aa]">Não recebeu?</span>
              {cooldown > 0 ? (
                <span className="text-[13px] font-semibold text-[#c3b6c8]">
                  Reenviar em {cooldownLabel}
                </span>
              ) : (
                <button
                  type="button"
                  disabled={sending || !phoneReady}
                  onClick={requestCode}
                  className="text-[13px] font-bold text-[#be185d] disabled:opacity-50"
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
              <p className="mt-2.5 text-center text-[12.5px] text-[#a394aa]">
                Escolha um horário no passo 1 para confirmar.
              </p>
            )}
          </div>
        </section>
      </form>
    </div>
  );
}
