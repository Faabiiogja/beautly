const TONE_CLASSES = {
  error: 'bg-danger-tint text-danger',
  success: 'bg-success-tint text-success',
  info: 'bg-brand-tint text-primary',
} as const

export function FormMessage({ tone, children }: { tone: keyof typeof TONE_CLASSES; children: React.ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-card px-4 py-3 text-sm ${TONE_CLASSES[tone]}`}>
      {children}
    </p>
  )
}
