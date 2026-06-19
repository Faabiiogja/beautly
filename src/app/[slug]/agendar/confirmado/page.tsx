import { prisma } from "@/lib/prisma";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.9-.1 1.5Z" />
    </svg>
  );
}

export default async function ConfirmadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ startAt?: string; serviceId?: string }>;
}) {
  const { slug } = await params;
  const { startAt, serviceId } = await searchParams;
  const business = await findBusinessBySlug(slug);
  if (!business || !startAt || !serviceId) notFound();
  if (Number.isNaN(Date.parse(startAt))) notFound();

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
  });
  if (!service) notFound();

  const when = formatInTimeZone(
    new Date(startAt),
    business.timezone,
    "EEE, d 'de' MMM '·' HH:mm",
    { locale: ptBR },
  );

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 px-4 py-6 sm:py-8 lg:py-10">
      <div className="overflow-hidden rounded-[2rem] bg-white px-6 pb-8 pt-10 text-center shadow-glow-strong ring-1 ring-black/5 sm:rounded-[2.25rem]">
        <span
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full shadow-glow-strong"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 40%, #d1fadf, #b6f3cd)",
          }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-success-600 to-success-700">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-8 w-8"
              aria-hidden
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
        </span>

        <h1 className="font-display text-[25px] font-semibold leading-snug text-ink-900">
          Agendamento confirmado!
        </h1>
        <p className="mx-auto mt-2.5 mb-7 max-w-xs text-[14.5px] leading-relaxed text-ink-500">
          Te esperamos no {business.name}. Você também receberá os detalhes por
          WhatsApp.
        </p>

        <dl className="surface-muted mb-6 px-[18px] py-0 text-left">
          <div className="flex items-center justify-between border-b border-cream-200 py-[15px]">
            <dt className="text-[13.5px] font-medium text-ink-500">Serviço</dt>
            <dd className="text-[14.5px] font-semibold text-ink-900">
              {service.name}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-cream-200 py-[15px]">
            <dt className="text-[13.5px] font-medium text-ink-500">
              Data e hora
            </dt>
            <dd className="text-[14.5px] font-semibold capitalize text-ink-900">
              {when}
            </dd>
          </div>
          <div className="flex items-center justify-between py-[15px]">
            <dt className="text-[13.5px] font-medium text-ink-500">Valor</dt>
            <dd className="font-display text-lg font-semibold text-brand-700">
              R$ {service.price}
            </dd>
          </div>
        </dl>

        {business.defaultMessage && (
          <p className="alert-info mb-6 text-left">{business.defaultMessage}</p>
        )}

        <a
          href={whatsappLink(business.contactPhone)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp mb-3.5 w-full"
        >
          <WhatsAppGlyph className="h-5 w-5" />
          Falar no WhatsApp · {formatPhone(business.contactPhone)}
        </a>
        <Link
          href={`/${slug}/meus-agendamentos`}
          className="block text-sm font-semibold text-lilac-600 transition hover:text-brand-700"
        >
          Ver meus agendamentos →
        </Link>
      </div>
    </main>
  );
}
