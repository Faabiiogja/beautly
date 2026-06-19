"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode, useId, useRef } from "react";

interface Props {
  /** Elemento que dispara o diálogo quando clicado (geralmente um botão). */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Variante de cor do botão de confirmar. */
  danger?: boolean;
  /** Inputs ocultos do formulário (ex.: <input type="hidden" name="id" />).
   * Serão submetidos junto com a action definida em `action`. */
  children?: ReactNode;
  /** Server action submetida quando a usuária confirma. */
  action: (formData: FormData) => void;
}

/**
 * Diálogo de confirmação que submete um <form> com uma server action.
 * Substitui o antigo ConfirmButton (que usava window.confirm) — mantém a
 * semântica de "botão dentro de um form" mas com UX on-brand (Radix dialog).
 */
export function ConfirmForm({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Voltar",
  danger = false,
  children,
  action,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const descriptionId = useId();

  return (
    <AlertDialog.Root>
      <form ref={formRef} action={action}>
        {children}
        <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      </form>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-100 bg-white p-6 shadow-glow focus:outline-none"
          aria-describedby={descriptionId}
        >
          <AlertDialog.Title className="font-display text-xl font-semibold text-ink-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description
            id={descriptionId}
            className="mt-2 text-sm leading-relaxed text-ink-700"
          >
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex gap-3">
            <AlertDialog.Cancel className="btn-secondary flex-1">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={() => formRef.current?.requestSubmit()}
              className={
                danger
                  ? "btn-danger flex-1"
                  : "btn-solid flex-1"
              }
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
