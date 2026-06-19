import { type ReactNode } from "react";

interface Props {
  /** Conteúdo do cabeçalho (geralmente um <PublicShell.Header>). O cabeçalho
   * pode usar `.gradient-header` (página inicial pública) ou um header simples
   * com `.link-back` (demais páginas). */
  header?: ReactNode;
  children: ReactNode;
  /** Classe extra aplicada ao container interno (área de conteúdo). */
  bodyClassName?: string;
  /** Variante de fundo do "cartão" externo. `default` = branco (tela de
   * confirmação, página inicial); `muted` = creme claro (telas com forms
   * densos, como agendamento e meus-agendamentos). */
  tone?: "default" | "muted";
}

/**
 * Moldura mobile compartilhada por todas as páginas públicas (/[slug]/*).
 * No desktop, aparece como um "telefone" centralizado sobre o fundo creme,
 * mantendo a identidade de "página de app" mesmo em telas grandes.
 */
export function PublicShell({
  header,
  children,
  bodyClassName = "px-5 pb-7 pt-5",
  tone = "default",
}: Props) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 px-4 py-6 sm:py-8 lg:py-10">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-glow-strong ring-1 ring-black/5 sm:rounded-[2.25rem]">
        {header}
        <div className={tone === "muted" ? "bg-cream-50" : ""}>
          <div className={bodyClassName}>{children}</div>
        </div>
      </div>
    </main>
  );
}

/**
 * Barra de header interna com link "Voltar". Usada nas subpáginas públicas
 * (agendar, meus-agendamentos). Opcionalmente recebe um título/subtítulo.
 */
export function PublicShellBar({
  backHref,
  backLabel = "Voltar",
  title,
  subtitle,
}: {
  backHref: string;
  backLabel?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="border-b border-cream-200 bg-white px-5 py-3.5">
      <a href={backHref} className="link-back">
        <span aria-hidden>←</span> {backLabel}
      </a>
      {title && (
        <div className="mt-2">
          <p className="font-display text-[22px] font-semibold tracking-tight text-ink-900">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-[13px] font-medium text-ink-500">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
