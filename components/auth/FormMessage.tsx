export function FormMessage({ tone, children }: { tone: 'error' | 'info'; children: React.ReactNode }) {
  const styles = tone === 'error' ? 'bg-danger-tint text-danger' : 'bg-brand-tint text-primary'
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-card px-4 py-3 text-sm ${styles}`}>
      {children}
    </p>
  )
}
