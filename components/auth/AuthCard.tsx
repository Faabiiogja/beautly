import { BrandEmblem } from '@/components/public/BrandEmblem'
import { Shell } from '@/components/public/Shell'

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <Shell>
      <main className="flex flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-container-low p-3 shadow-soft">
            <BrandEmblem />
          </div>
          <h1 className="font-headline text-headline-md text-ink">{title}</h1>
          {subtitle && <p className="mt-1 max-w-[320px] text-sm text-muted">{subtitle}</p>}
        </div>
        <div className="rounded-panel bg-card p-6 shadow-soft">{children}</div>
      </main>
    </Shell>
  )
}
