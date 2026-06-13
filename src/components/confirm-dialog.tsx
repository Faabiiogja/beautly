"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode } from "react";

interface Props {
  /** O gatilho clicável (ex.: um botão). */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Chamado quando a usuária confirma. */
  onConfirm: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Voltar",
  onConfirm,
  danger = false,
}: Props) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-100 bg-white p-6 shadow-glow focus:outline-none">
          <AlertDialog.Title className="font-display text-xl font-semibold text-ink-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-ink-700">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex gap-3">
            <AlertDialog.Cancel className="btn-secondary flex-1">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={
                danger
                  ? "flex-1 inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
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
