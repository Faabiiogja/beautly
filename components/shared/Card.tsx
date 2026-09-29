// Cartão branco do design system: base de formulários e blocos de conteúdo elevados.
export function Card({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-panel border border-border-soft bg-card p-6 shadow-soft sm:p-8 ${className}`}>{children}</div>
}
