import { formatPhone } from '@/lib/phone'
import type { PublicService, PublicTenant } from '@/lib/tenants'
import { BrandEmblem } from './BrandEmblem'
import { BookingFlow } from './BookingFlow'
import { ChatIcon, PinIcon } from './icons'
import { Shell } from './Shell'

// Só dígitos, com DDI 55 se ainda não tiver, para o link do WhatsApp.
const whatsappUrl = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  return `https://wa.me/${digits.startsWith('55') ? digits : `55${digits}`}`
}

export function BusinessPage({ tenant, services, days }: { tenant: PublicTenant; services: PublicService[]; days: { day: string; open: boolean }[] }) {
  return (
    <Shell>
      <main className="flex flex-col pb-10">
        <header className="flex flex-col items-center px-5 pt-6 pb-6 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-container-low p-3 shadow-soft">
            {tenant.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- domínio do storage ainda não definido
              <img src={tenant.logo_url} alt="" className="h-full w-full rounded-full object-cover" />
            ) : (
              <BrandEmblem />
            )}
          </div>
          <h1 className="mb-1 font-headline text-headline-md text-ink">{tenant.business_name}</h1>
          {tenant.description && <p className="mb-4 max-w-[340px] text-sm text-muted">{tenant.description}</p>}
          <div className="mt-3 flex w-full flex-wrap items-center justify-center gap-2">
            <a
              href={whatsappUrl(tenant.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center gap-2 rounded-full bg-card px-4 text-label-sm text-ink shadow-soft transition active:scale-95"
            >
              <span className="text-brand">
                <ChatIcon />
              </span>
              {formatPhone(tenant.phone)}
            </a>
            {tenant.address && (
              <div className="flex min-h-12 items-center gap-2 rounded-full bg-card px-4 text-label-sm text-muted shadow-soft">
                <span className="text-primary">
                  <PinIcon />
                </span>
                {tenant.address}
              </div>
            )}
          </div>
        </header>

        <BookingFlow services={services} days={days} />
      </main>
    </Shell>
  )
}
