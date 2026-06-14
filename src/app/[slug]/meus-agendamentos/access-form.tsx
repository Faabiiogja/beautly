"use client";

import { OtpInput } from "@/components/otp-input";
import { useActionState, useState } from "react";
import {
  requestAccessAction,
  verifyAccessAction,
  type AccessState,
} from "./actions";

export function AccessForm({ slug }: { slug: string }) {
  const [phone, setPhone] = useState("");
  const [reqState, reqAction, requesting] = useActionState<
    AccessState | null,
    FormData
  >(requestAccessAction, null);
  const [verState, verAction, verifying] = useActionState<
    AccessState | null,
    FormData
  >(verifyAccessAction, null);

  const sent = Boolean(reqState?.sent);
  const phoneReady = phone.replace(/\D/g, "").length >= 10;

  return (
    <form className="rounded-[22px] border border-[#f0e6ee] bg-white p-5 shadow-[0_4px_14px_-8px_rgba(157,23,77,0.16)]">
      <input type="hidden" name="slug" value={slug} />

      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-[18px] border border-[#f4dcee] bg-gradient-to-br from-[#fdeef7] to-[#f3ecfb]">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#be185d"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <p className="font-display text-[21px] font-semibold text-[#2c1f29]">
          Acesse seus agendamentos
        </p>
        <p className="mt-2 text-sm leading-normal text-[#8a7f94]">
          Confirme seu telefone para ver e gerenciar seus horários.
        </p>
      </div>

      <label
        htmlFor="access-phone"
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
          id="access-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="(11) 90000-0000"
          required
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          className="w-full bg-transparent py-2.5 text-base font-medium text-[#2c1f29] placeholder:font-normal placeholder:text-[#b6a7bd] focus:outline-none"
        />
      </div>

      <button
        formAction={reqAction}
        disabled={requesting || !phoneReady}
        className={sent ? "btn-secondary w-full" : "btn-primary w-full"}
      >
        {requesting ? "Enviando..." : sent ? "Reenviar código" : "Enviar código"}
      </button>
      {reqState?.error && <p className="alert-error mt-3">{reqState.error}</p>}

      {sent && (
        <p className="mt-3 text-center text-[12.5px] leading-snug text-emerald-600">
          Código enviado! Confira seu SMS ou WhatsApp e digite abaixo.
        </p>
      )}

      <div className="mt-5">
        <label className="mb-2 block text-[13px] font-semibold text-[#574a54]">
          Código recebido
        </label>
        <OtpInput name="code" invalid={Boolean(verState?.error)} />
      </div>

      <button
        formAction={verAction}
        disabled={verifying}
        className="btn-primary mt-4 w-full"
      >
        {verifying ? "Verificando..." : "Acessar meus agendamentos"}
      </button>
      {verState?.error && <p className="alert-error mt-3">{verState.error}</p>}

      <p className="mt-3.5 text-center text-[12.5px] leading-snug text-[#a394aa]">
        Usamos o código só para confirmar que o número é seu.
      </p>
    </form>
  );
}
