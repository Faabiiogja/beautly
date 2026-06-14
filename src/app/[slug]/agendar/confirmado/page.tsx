import { prisma } from "@/lib/prisma";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { formatInTimeZone } from "date-fns-tz";
import { ptBR } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";

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
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-6">
      <div className="overflow-hidden rounded-[32px] bg-white px-6 pb-8 pt-10 text-center shadow-[0_30px_60px_-30px_rgba(157,23,77,0.35)] ring-1 ring-black/5">
        <span
          className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full shadow-[0_14px_30px_-12px_rgba(22,163,74,0.5)]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 50% 40%, #d6f5e3, #bdeccf)",
          }}
        >
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#22c55e] to-[#16a34a]">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#fff"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M5 12.5l4.5 4.5L19 7" />
            </svg>
          </span>
        </span>

        <h1 className="font-display text-[25px] font-semibold leading-snug text-[#2c1f29]">
          Agendamento confirmado!
        </h1>
        <p className="mx-auto mt-2.5 mb-7 max-w-xs text-[14.5px] leading-relaxed text-[#8a7f94]">
          Te esperamos no {business.name}. Você também receberá os detalhes por
          WhatsApp.
        </p>

        <dl className="mb-6 rounded-[22px] border border-[#f0e6ee] bg-[#faf6fb] px-[18px] py-1.5 text-left">
          <div className="flex items-center justify-between border-b border-[#f0e6ee] py-[15px]">
            <dt className="text-[13.5px] font-medium text-[#9b8a98]">Serviço</dt>
            <dd className="text-[14.5px] font-semibold text-[#2c1f29]">
              {service.name}
            </dd>
          </div>
          <div className="flex items-center justify-between border-b border-[#f0e6ee] py-[15px]">
            <dt className="text-[13.5px] font-medium text-[#9b8a98]">
              Data e hora
            </dt>
            <dd className="text-[14.5px] font-semibold capitalize text-[#2c1f29]">
              {when}
            </dd>
          </div>
          <div className="flex items-center justify-between py-[15px]">
            <dt className="text-[13.5px] font-medium text-[#9b8a98]">Valor</dt>
            <dd className="font-display text-lg font-semibold text-[#be185d]">
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
          className="mb-3.5 flex w-full items-center justify-center gap-2.5 rounded-[15px] py-3.5 text-[15.5px] font-semibold text-white shadow-[0_12px_24px_-10px_rgba(37,211,102,0.6)]"
          style={{ backgroundImage: "linear-gradient(135deg,#25d366,#1eb955)" }}
        >
          <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.4-.7-2.9-1.1-4.7-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-1.9.9-2.2c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.3.7 1.1 1.4 1.7.9.8 1.6 1 1.9 1.2.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.6-.1l1.8.9c.3.1.5.2.5.4.1.2.1.9-.1 1.5Z" />
          </svg>
          Falar no WhatsApp · {formatPhone(business.contactPhone)}
        </a>
        <Link
          href={`/${slug}/meus-agendamentos`}
          className="block text-sm font-semibold text-[#9b6aa0]"
        >
          Ver meus agendamentos →
        </Link>
      </div>
    </main>
  );
}
