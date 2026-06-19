import { type ReactNode } from "react";

interface Props {
  /** Texto ao lado do wordmark "Beautly" no header. */
  context: string;
  /** URL do post de logout (ex.: "/admin/logout"). */
  logoutAction: string;
  /** Link opcional "Ver minha página" no header (admin tem, platform não). */
  viewPageHref?: string;
  /** Conteúdo adicional do header (navegação, por exemplo). */
  nav?: ReactNode;
  children: ReactNode;
}

/**
 * Shell compartilhado pelas áreas logadas (admin e platform). Centraliza em
 * max-w-3xl, usa o wordmark Beautly + contexto, e aplica o fundo creme da LP.
 */
export function AdminShell({
  context,
  logoutAction,
  viewPageHref,
  nav,
  children,
}: Props) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-cream-200/70 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto w-full max-w-3xl px-5 pt-4 sm:px-8">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-display text-lg font-semibold tracking-tight text-brand-700">
                Beautly
              </span>
              <span className="mx-2 text-cream-300">·</span>
              <span className="truncate text-sm text-ink-500">{context}</span>
            </div>
            <div className="flex items-center gap-3">
              {viewPageHref && (
                <a
                  href={viewPageHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden rounded-full px-3 py-1.5 text-sm font-medium text-ink-700 transition hover:text-brand-700 sm:inline-block"
                >
                  Ver minha página ↗
                </a>
              )}
              <form action={logoutAction} method="post">
                <button
                  type="submit"
                  className="rounded-full px-3 py-1.5 text-sm font-medium text-ink-500 transition hover:text-brand-700"
                >
                  Sair
                </button>
              </form>
            </div>
          </div>
          {nav && <div className="mt-3 pb-2">{nav}</div>}
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-5 py-8 sm:px-8">
        {children}
      </div>
    </div>
  );
}
