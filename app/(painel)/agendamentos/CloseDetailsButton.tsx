'use client'

// Fecha o <details> mais próximo sem JS nenhum ser exigido pra abrir/confirmar (só esse botão
// "Manter" é um toque a mais de conforto; sem JS, clicar de novo no "Cancelar" já fecha).
export function CloseDetailsButton({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={(event) => event.currentTarget.closest('details')?.removeAttribute('open')}
    >
      {children}
    </button>
  )
}
