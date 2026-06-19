import { formatPhone, whatsappLink } from "@/lib/phone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { listActiveServices } from "@/services/service-catalog";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5c.9 5.2 3.4 7.7 8.6 8.6-5.2.9-7.7 3.4-8.6 8.6-.9-5.2-3.4-7.7-8.6-8.6 5.2-.9 7.7-3.4 8.6-8.6Z" />
    </svg>
  );
}

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.9-.1 1.5Z" />
    </svg>
  );
}

function ClockGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CalendarPausedGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBusinessBySlug(slug);
  if (!business) notFound();

  const initial = business.name.charAt(0).toUpperCase();

  if (business.status !== "ACTIVE") {
    return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 sm:py-8 lg:py-10">
        <div className="overflow-hidden rounded-[2rem] bg-white shadow-glow-strong ring-1 ring-black/5 sm:rounded-[2.25rem]">
          <header
            className="px-7 pb-9 pt-9 text-center text-white"
            style={{
              backgroundImage:
                "linear-gradient(150deg, #c9aef0 0%, #b79ced 60%, #c9aef0 110%)",
            }}
          >
            <span className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-glow-strong">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  width={76}
                  height={76}
                  className="h-[76px] w-[76px] rounded-full object-cover grayscale"
                />
              ) : (
                <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-lilac-300 to-lilac-400 font-display text-3xl font-semibold text-white">
                  {initial}
                </span>
              )}
            </span>
            <h1 className="font-display mt-4 text-[25px] font-semibold leading-tight">
              {business.name}
            </h1>
          </header>
          <div className="px-6 pb-12 pt-10">
            <div className="surface-muted px-6 py-8 text-center">
              <span className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-cream-100 text-lilac-600">
                <CalendarPausedGlyph className="h-6 w-6" />
              </span>
              <p className="font-display text-lg font-semibold text-ink-900">
                Agendamentos pausados
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Os agendamentos não estão disponíveis no momento. Volte mais
                tarde ou fale direto pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  const services = await listActiveServices(business.id);
  const subtitle = services
    .slice(0, 3)
    .map((service) => service.name)
    .join(" · ");

  return (
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6 sm:py-8 lg:py-10">
      <div className="overflow-hidden rounded-[2rem] bg-white shadow-glow-strong ring-1 ring-black/5 sm:rounded-[2.25rem]">
        <header className="gradient-header px-7 pb-8 pt-9 text-center text-white">
          <span className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-glow-strong">
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={`Logo de ${business.name}`}
                width={76}
                height={76}
                className="h-[76px] w-[76px] rounded-full object-cover"
              />
            ) : (
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-lilac-400 font-display text-3xl font-semibold text-white">
                {initial}
              </span>
            )}
          </span>
          <h1 className="font-display mt-4 text-[25px] font-semibold leading-tight">
            {business.name}
          </h1>
          {subtitle && <p className="mt-1 text-sm text-white/90">{subtitle}</p>}
          <a
            href={whatsappLink(business.contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white py-2 pl-2.5 pr-4 text-sm font-semibold text-success-700 shadow-md"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-whatsapp text-white">
              <WhatsAppGlyph className="h-4 w-4" />
            </span>
            {formatPhone(business.contactPhone)}
          </a>
        </header>

        <div className="px-5 pb-7 pt-6">
          {business.defaultMessage && (
            <p className="mb-5 text-[14.5px] leading-relaxed text-ink-700">
              {business.defaultMessage}
            </p>
          )}

          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
              Serviços
            </h2>
            {services.length > 1 && (
              <span className="text-[12.5px] font-semibold text-lilac-500">
                Arraste para ver →
              </span>
            )}
          </div>

          {services.length === 0 ? (
            <p className="alert-info">Não há serviços disponíveis no momento.</p>
          ) : (
            <div className="-mx-5 flex snap-x snap-mandatory gap-3.5 overflow-x-auto px-5 pb-3.5">
              {services.map((service) => (
                <Link
                  key={service.id}
                  href={`/${slug}/agendar?serviceId=${service.id}`}
                  className="surface group w-[200px] shrink-0 snap-start overflow-hidden p-0 transition hover:-translate-y-0.5 hover:shadow-glow"
                >
                  <div className="gradient-brand flex h-[148px] items-center justify-center text-white">
                    <Sparkle className="h-9 w-9 opacity-90" />
                  </div>
                  <div className="p-4">
                    <p className="min-h-[38px] text-[15.5px] font-semibold leading-tight text-ink-900">
                      {service.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink-500">
                        <ClockGlyph className="h-3.5 w-3.5" />
                        {service.durationMinutes} min
                      </span>
                      <span className="font-display text-lg font-semibold text-brand-700">
                        R$ {service.price}
                      </span>
                    </div>
                    <span className="btn-primary mt-3 w-full">Agendar</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href={`/${slug}/meus-agendamentos`}
            className="mt-6 block text-center text-sm font-semibold text-lilac-600 transition hover:text-brand-700"
          >
            Meus agendamentos →
          </Link>
        </div>
      </div>
    </main>
  );
}
