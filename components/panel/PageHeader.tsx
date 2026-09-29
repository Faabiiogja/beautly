export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="font-headline text-headline-lg text-ink">{title}</h1>
      {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
    </header>
  )
}
