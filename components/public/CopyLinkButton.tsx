'use client'

import { useState } from 'react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // sem permissão de área de transferência: o link continua visível na página para copiar à mão
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="h-12 w-full rounded-full border-[1.5px] border-border-soft bg-card text-label-md text-ink transition active:scale-[0.98]"
    >
      {copied ? 'Link copiado!' : 'Copiar link do agendamento'}
    </button>
  )
}
