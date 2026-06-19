"use client";

import Link from "next/link";
import { useActionState } from "react";

interface Props {
  /** Server action que processa o login. Deve receber FormData e retornar
   * `{ error?: string } | null`. */
  action: (state: { error?: string } | null, formData: FormData) => Promise<
    { error?: string } | null
  >;
  /** Subtítulo exibido abaixo do wordmark Beautly. */
  subtitle: string;
  /** URL de retorno (não usado pelo form, mas p/ "voltar" se necessário). */
  backHref?: string;
}

/**
 * Form de login (e-mail + senha) compartilhado entre admin e platform.
 * Substitui as duas páginas quase-idênticas que existiam.
 */
export function LoginForm({ action, subtitle }: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-12 sm:px-6">
      <div className="card p-7">
        <div className="text-center">
          <span className="font-display text-2xl font-semibold text-brand-700">
            Beautly
          </span>
          <h1 className="mt-1 text-sm text-ink-500">{subtitle}</h1>
        </div>
        <form action={formAction} className="mt-6 space-y-4">
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
          <button
            type="submit"
            disabled={pending}
            className="btn-primary w-full"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
      <p className="mt-6 text-center text-xs text-ink-500">
        <Link href="/" className="hover:text-brand-700">
          ← Voltar para o site
        </Link>
      </p>
    </main>
  );
}
