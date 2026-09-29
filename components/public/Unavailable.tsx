import { BrandEmblem } from './BrandEmblem'
import { Shell } from './Shell'

// Mesma página para subdomínio inexistente e tenant inativo: não revela qual dos dois é
// nem mostra dados de nenhum negócio.
export function Unavailable() {
  return (
    <Shell>
      <main className="flex flex-1 flex-col justify-center px-5 py-10">
        <div className="flex flex-col items-center rounded-panel bg-card p-6 text-center shadow-soft">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-container-low">
            <BrandEmblem className="h-14 w-14" />
          </div>
          <h1 className="max-w-[280px] font-headline text-headline-md text-ink">Página indisponível</h1>
          <p className="mt-2 max-w-[320px] text-base leading-relaxed text-muted">
            Este espaço de agendamento não está disponível no momento. Se você precisa de ajuda com um horário,
            fale diretamente com a profissional.
          </p>
        </div>
        <p className="mt-10 text-center text-sm text-muted">Beautly · Agendamentos simples para profissionais da beleza</p>
      </main>
    </Shell>
  )
}
