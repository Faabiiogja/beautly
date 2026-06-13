"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

export default function PlatformLoginPage() {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(
    loginAction,
    null,
  );

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-xl font-semibold">Beautly — Admin</h1>
      <form action={action} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          required
          className="w-full rounded border p-2"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
