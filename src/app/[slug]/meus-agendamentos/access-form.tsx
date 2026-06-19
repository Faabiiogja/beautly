"use client";

import { OtpInput } from "@/components/otp-input";
import { PhoneField } from "@/components/phone-field";
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
    <form className="surface p-5">
      <input type="hidden" name="slug" value={slug} />

      <div className="mb-6 text-center">
        <span className="mx-auto mb-4 flex h-15 w-15 items-center justify-center rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-lilac-50 text-brand-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-7 w-7"
            aria-hidden
          >
            <rect x="4" y="10" width="16" height="11" rx="2.5" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </span>
        <p className="font-display text-[21px] font-semibold text-ink-900">
          Acesse seus agendamentos
        </p>
        <p className="mt-2 text-sm leading-normal text-ink-500">
          Confirme seu telefone para ver e gerenciar seus horários.
        </p>
      </div>

      <label
        htmlFor="access-phone"
        className="mb-2 block text-[13px] font-semibold text-ink-700"
      >
        Número com DDD
      </label>
      <div className="mb-3.5">
        <PhoneField
          id="access-phone"
          placeholder="(11) 90000-0000"
          value={phone}
          onChange={setPhone}
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
        <p className="mt-3 text-center text-[12.5px] leading-snug text-success-700">
          Código enviado! Confira seu SMS ou WhatsApp e digite abaixo.
        </p>
      )}

      <div className="mt-5">
        <label className="mb-2 block text-[13px] font-semibold text-ink-700">
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

      <p className="mt-3.5 text-center text-[12.5px] leading-snug text-ink-500">
        Usamos o código só para confirmar que o número é seu.
      </p>
    </form>
  );
}
