'use client'

import { useCopyToClipboard } from '@/components/shared/useCopyToClipboard'

export function CopyLinkButton({ url }: { url: string }) {
  const { copied, copy } = useCopyToClipboard()
  return (
    <button
      type="button"
      onClick={() => copy(url)}
      className="h-12 w-full rounded-full border-[1.5px] border-border-soft bg-card text-label-md text-ink transition active:scale-[0.98]"
    >
      {copied ? 'Link copiado!' : 'Copiar link do agendamento'}
    </button>
  )
}
