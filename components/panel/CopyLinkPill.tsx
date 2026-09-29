'use client'

import { useCopyToClipboard } from '@/components/shared/useCopyToClipboard'
import { CopyIcon } from '@/components/public/icons'

// Pílula compacta pra copiar o link público do negócio, usada na barra lateral do painel.
export function CopyLinkPill({ url, display }: { url: string; display: string }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <button
      type="button"
      onClick={() => copy(url)}
      className="flex w-full items-center justify-between gap-2 rounded-full border border-border-soft bg-card px-3 py-1.5 text-label-sm text-muted transition hover:border-brand hover:text-ink"
    >
      <span className="truncate font-mono">{copied ? 'Link copiado!' : display}</span>
      <span className="shrink-0 text-brand">
        <CopyIcon />
      </span>
    </button>
  )
}
