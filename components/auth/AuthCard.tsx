import { Card } from '@/components/shared/Card'
import { Logo } from '@/components/shared/Logo'

// Layout das telas de acesso (login, esqueci senha, redefinir senha): no desktop, painel decorativo
// à esquerda + cartão centralizado à direita; no celular, coluna única com a marca no topo.
export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-canvas md:flex-row">
      <aside className="relative hidden overflow-hidden border-border-soft bg-container-low px-10 py-12 md:flex md:w-[42%] md:flex-col md:justify-between md:border-r lg:w-[40%]">
        <div aria-hidden className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-petal-soft/40 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-16 -bottom-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
        <div className="relative">
          <Logo />
        </div>
        <div className="relative max-w-sm">
          <h2 className="font-headline text-headline-lg leading-tight text-ink">
            Sua agenda,
            <br />
            <span className="text-brand italic">do seu jeito.</span>
          </h2>
          <p className="mt-4 text-body-md leading-relaxed text-muted">
            Menos ida e volta pelo WhatsApp pra marcar horário. A cliente agenda sozinha, você só confirma.
          </p>
        </div>
        <p className="relative text-label-sm text-muted uppercase">Painel da Profissional</p>
      </aside>

      <main className="flex flex-1 flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="mb-8 flex flex-col items-center text-center md:hidden">
          <Logo />
          <p className="mt-2 text-sm text-muted">
            Sua agenda, <span className="text-brand italic">do seu jeito.</span>
          </p>
        </div>

        <Card className="w-full max-w-[420px]">
          <header className="mb-6">
            <h1 className="font-headline text-headline-md text-ink">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>}
          </header>
          {children}
        </Card>

        <p className="mt-6 text-center text-label-sm text-muted">beautly.cloud</p>
      </main>
    </div>
  )
}
