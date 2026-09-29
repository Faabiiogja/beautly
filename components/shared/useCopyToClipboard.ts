'use client'

import { useEffect, useRef, useState } from 'react'

// Estado de "copiado" com reset automático, compartilhado pelos botões de copiar link
// (público da cliente e da profissional). Limpa o timer no unmount e em cliques seguidos,
// pra não sobrar um setState de componente desmontado nem piscar entre cliques rápidos.
export function useCopyToClipboard(resetMs = 2500) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
  }, [])

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), resetMs)
    } catch {
      // sem permissão de área de transferência: o link continua visível na página para copiar à mão
    }
  }

  return { copied, copy }
}
