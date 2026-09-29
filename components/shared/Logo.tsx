import { BrandEmblem } from '@/components/public/BrandEmblem'

// Marca Beautly (emblema + wordmark), reaproveitada fora das telas públicas de agendamento:
// acesso da profissional, painel, landing. O emblema em si é o mesmo BrandEmblem do fluxo público.
export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const badge = size === 'sm' ? 'h-8 w-8 p-1.5' : 'h-10 w-10 p-2'
  const wordmark = size === 'sm' ? 'text-lg' : 'text-xl'
  return (
    <div className="flex items-center gap-2.5">
      <div className={`flex items-center justify-center rounded-full bg-container-low ${badge}`}>
        <BrandEmblem />
      </div>
      <span className={`font-headline font-bold tracking-tight text-ink ${wordmark}`}>
        Beautly<span className="text-brand">.</span>
      </span>
    </div>
  )
}
