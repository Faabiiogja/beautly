"use client";

import { useActionState } from "react";
import {
  requestAccessAction,
  verifyAccessAction,
  type AccessState,
} from "./actions";

export function AccessForm({ slug }: { slug: string }) {
  const [reqState, reqAction, requesting] = useActionState<
    AccessState | null,
    FormData
  >(requestAccessAction, null);
  const [verState, verAction, verifying] = useActionState<
    AccessState | null,
    FormData
  >(verifyAccessAction, null);

  const sent = Boolean(reqState?.sent);

  return (
    <form className="card space-y-4 p-5">
      <p className="text-sm text-zinc-600">
        Para ver seus agendamentos, confirme o telefone usado na hora de
        agendar.
      </p>

      <input type="hidden" name="slug" value={slug} />

      <div>
        <label htmlFor="access-phone" className="field-label">
          Telefone (WhatsApp)
        </label>
        <input
          id="access-phone"
          name="phone"
          type="tel"
          inputMode="tel"
          placeholder="(11) 99999-8888"
          required
          className="input"
        />
      </div>

      <button
        formAction={reqAction}
        disabled={requesting}
        className={sent ? "btn-secondary w-full" : "btn-primary w-full"}
      >
        {requesting ? "Enviando..." : sent ? "Reenviar código" : "Receber código"}
      </button>
      {reqState?.error && <p className="alert-error">{reqState.error}</p>}
      {sent && (
        <p className="alert-success">
          Código enviado! Confira seu telefone e digite abaixo.
        </p>
      )}

      <div>
        <label htmlFor="access-code" className="field-label">
          Código recebido
        </label>
        <input
          id="access-code"
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="000000"
          className="input"
        />
      </div>

      <button formAction={verAction} disabled={verifying} className="btn-primary w-full">
        {verifying ? "Verificando..." : "Acessar meus agendamentos"}
      </button>
      {verState?.error && <p className="alert-error">{verState.error}</p>}
    </form>
  );
}
