"use client";

import { useActionState } from "react";
import { loginAction, type AdminLoginState } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState<
    AdminLoginState | null,
    FormData
  >(loginAction, null);
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-12">
      <div className="card p-7">
        <p className="font-display text-center text-2xl font-semibold text-brand-700">
          Beautly
        </p>
        <h1 className="mt-1 text-center text-sm text-zinc-500">
          Área da profissional
        </h1>
        <form action={action} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="field-label">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="voce@exemplo.com"
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="password" className="field-label">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="input"
            />
          </div>
          {state?.error && <p className="alert-error">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
