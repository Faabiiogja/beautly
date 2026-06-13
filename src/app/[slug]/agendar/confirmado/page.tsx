import { prisma } from "@/lib/prisma";
import { formatPhone, whatsappLink } from "@/lib/phone";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { formatInTimeZone } from "date-fns-tz";
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
    "dd/MM/yyyy 'às' HH:mm",
  );

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
      <div className="card text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="h-7 w-7 text-emerald-600"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
              clipRule="evenodd"
            />
          </svg>
        </span>
        <h1 className="font-display mt-4 text-2xl font-semibold text-zinc-900">
          Agendamento confirmado!
        </h1>

        <dl className="mt-6 space-y-3 rounded-xl bg-zinc-50 p-4 text-left text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Serviço</dt>
            <dd className="font-medium text-zinc-900">{service.name}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Data e hora</dt>
            <dd className="font-medium text-zinc-900">{when}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Valor</dt>
            <dd className="font-medium text-zinc-900">R$ {service.price}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-zinc-500">Profissional</dt>
            <dd className="font-medium text-zinc-900">{business.name}</dd>
          </div>
        </dl>

        {business.defaultMessage && (
          <p className="alert-info mt-4 text-left">{business.defaultMessage}</p>
        )}

        <div className="mt-6 space-y-3">
          <Link href={`/${slug}/meus-agendamentos`} className="btn-primary w-full">
            Ver meus agendamentos
          </Link>
          <a
            href={whatsappLink(business.contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary w-full"
          >
            Falar com {business.name} · {formatPhone(business.contactPhone)}
          </a>
        </div>
      </div>
    </main>
  );
}
