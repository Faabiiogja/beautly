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
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
        <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-30px_rgba(80,80,100,0.28)] ring-1 ring-black/5">
          <header
            className="px-7 pb-9 pt-9 text-center text-white"
            style={{
              backgroundImage:
                "linear-gradient(150deg,#b8a7c4 0%,#a99cba 60%,#c0a9c6 110%)",
            }}
          >
            <span className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-8px_rgba(50,40,60,0.35)]">
              {business.logoUrl ? (
                <Image
                  src={business.logoUrl}
                  alt={`Logo de ${business.name}`}
                  width={76}
                  height={76}
                  className="h-[76px] w-[76px] rounded-full object-cover grayscale"
                />
              ) : (
                <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#cbbdd4] to-[#b6a7c4] font-display text-3xl font-semibold text-white">
                  {initial}
                </span>
              )}
            </span>
            <h1 className="font-display mt-4 text-[25px] font-semibold leading-tight">
              {business.name}
            </h1>
          </header>
          <div className="px-6 pb-12 pt-10">
            <div className="rounded-[22px] border border-[#e7e2ec] bg-[#f6f4f8] px-6 py-8 text-center">
              <span className="mx-auto mb-4 flex h-13 w-13 items-center justify-center rounded-full bg-[#ece7f0]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#8c7d97"
                  strokeWidth="2"
                  aria-hidden
                >
                  <rect x="3" y="5" width="18" height="16" rx="3" />
                  <path d="M3 10h18M8 3v4M16 3v4" />
                </svg>
              </span>
              <p className="font-display text-lg font-semibold text-[#4a4150]">
                Agendamentos pausados
              </p>
              <p className="mt-2 text-sm leading-relaxed text-[#8a7f94]">
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
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="overflow-hidden rounded-[32px] bg-white shadow-[0_30px_60px_-30px_rgba(157,23,77,0.35)] ring-1 ring-black/5">
        <header className="gradient-header px-7 pb-8 pt-9 text-center text-white">
          <span className="mx-auto flex h-22 w-22 items-center justify-center rounded-full bg-white shadow-[0_10px_28px_-8px_rgba(76,5,53,0.45)]">
            {business.logoUrl ? (
              <Image
                src={business.logoUrl}
                alt={`Logo de ${business.name}`}
                width={76}
                height={76}
                className="h-[76px] w-[76px] rounded-full object-cover"
              />
            ) : (
              <span className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-gradient-to-br from-[#f472b6] to-[#a78bfa] font-display text-3xl font-semibold text-white">
                {initial}
              </span>
            )}
          </span>
          <h1 className="font-display mt-4 text-[25px] font-semibold leading-tight">
            {business.name}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-white/90">{subtitle}</p>
          )}
          <a
            href={whatsappLink(business.contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white py-2 pl-2.5 pr-4 text-sm font-semibold text-[#1f8f4a] shadow-[0_6px_16px_-8px_rgba(0,0,0,0.3)]"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#25d366]">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff" aria-hidden>
                <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.9-.1 1.5Z" />
              </svg>
            </span>
            {formatPhone(business.contactPhone)}
          </a>
        </header>

        <div className="px-5 pb-7 pt-6">
          {business.defaultMessage && (
            <p className="mb-5 text-[14.5px] leading-relaxed text-[#574a54]">
              {business.defaultMessage}
            </p>
          )}

          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-display text-lg font-semibold text-[#3f2a3a]">
              Serviços
            </h2>
            {services.length > 1 && (
              <span className="text-[12.5px] font-semibold text-[#b09cb6]">
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
                  className="w-[200px] shrink-0 snap-start overflow-hidden rounded-[22px] border border-[#f0e6ee] bg-white shadow-[0_8px_22px_-12px_rgba(157,23,77,0.24)] transition hover:-translate-y-0.5"
                >
                  <div className="gradient-brand flex h-[148px] items-center justify-center text-white">
                    <Sparkle className="h-9 w-9 opacity-90" />
                  </div>
                  <div className="p-4">
                    <p className="min-h-[38px] text-[15.5px] font-semibold leading-tight text-[#2c1f29]">
                      {service.name}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#9b8a98]">
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          aria-hidden
                        >
                          <circle cx="12" cy="12" r="9" />
                          <path d="M12 7v5l3 2" />
                        </svg>
                        {service.durationMinutes} min
                      </span>
                      <span className="font-display text-lg font-semibold text-[#be185d]">
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
            className="mt-6 block text-center text-sm font-semibold text-[#9b6aa0]"
          >
            Meus agendamentos →
          </Link>
        </div>
      </div>
    </main>
  );
}
