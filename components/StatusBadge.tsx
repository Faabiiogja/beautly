import type { DisplayStatus } from '@/lib/appointment-status'

const STATUS: Record<DisplayStatus, { label: string; className: string }> = {
  confirmed: { label: 'Confirmado', className: 'bg-brand-tint text-brand' },
  cancelled: { label: 'Cancelado', className: 'bg-danger-tint text-danger' },
  past: { label: 'Já aconteceu', className: 'bg-subtle text-muted' },
}

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const { label, className } = STATUS[status]
  return <span className={`inline-block rounded-full px-3 py-1 text-label-sm uppercase ${className}`}>{label}</span>
}
