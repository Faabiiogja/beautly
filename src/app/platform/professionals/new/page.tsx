"use client";

import { useActionState } from "react";
import {
  createProfessionalAction,
  type CreateProfessionalState,
} from "./actions";

export default function NewProfessionalPage() {
  const [state, action, pending] = useActionState<
    CreateProfessionalState | null,
    FormData
  >(createProfessionalAction, null);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Nova profissional</h1>
      <form action={action} className="space-y-4">
        <input
          name="businessName"
          placeholder="Nome do negócio"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="slug"
          placeholder="slug-da-pagina"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="contactPhone"
          placeholder="Telefone de contato"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="email"
          type="email"
          placeholder="E-mail de acesso"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Senha inicial"
          required
          className="w-full rounded border p-2"
        />
        <label className="flex items-center gap-2 text-sm">
          <input name="startActive" type="checkbox" defaultChecked /> Iniciar
          ativa
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? "Salvando..." : "Cadastrar"}
        </button>
      </form>
    </main>
  );
}
