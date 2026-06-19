"use client";

import Link from "next/link";
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
    <main className="mx-auto max-w-md">
      <Link
        href="/platform"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-brand-700"
      >
        ← Voltar
      </Link>
      <h1 className="font-display text-2xl font-semibold text-zinc-900">
        Nova profissional
      </h1>
      <form action={action} className="card mt-6 space-y-4 p-5">
        <div>
          <label htmlFor="businessName" className="field-label">
            Nome do negócio
          </label>
          <input
            id="businessName"
            name="businessName"
            placeholder="Maria Nails"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="slug" className="field-label">
            Endereço da página
          </label>
          <div className="flex items-center gap-1">
            <span className="text-sm text-zinc-400">beautly.com/</span>
            <input
              id="slug"
              name="slug"
              placeholder="maria-nails"
              pattern="[a-z0-9-]+"
              title="Apenas letras minúsculas, números e hífen"
              required
              className="input"
            />
          </div>
        </div>
        <div>
          <label htmlFor="contactPhone" className="field-label">
            Telefone de contato
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            placeholder="(11) 99999-8888"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            E-mail de acesso
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="maria@exemplo.com"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="password" className="field-label">
            Senha inicial
          </label>
          <input
            id="password"
            name="password"
            type="password"
            minLength={8}
            required
            className="input"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Mínimo de 8 caracteres, evite senhas óbvias. Combine com a
            profissional a troca no primeiro acesso.
          </p>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
          <input
            name="startActive"
            type="checkbox"
            defaultChecked
            className="h-4 w-4 rounded accent-brand-600"
          />
          Iniciar ativa (já pode receber agendamentos)
        </label>
        {state?.error && <p className="alert-error">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Salvando..." : "Cadastrar profissional"}
        </button>
      </form>
    </main>
  );
}
