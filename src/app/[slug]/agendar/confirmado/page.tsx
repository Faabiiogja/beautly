import { prisma } from "@/lib/prisma";
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

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const when = formatInTimeZone(
    new Date(startAt),
    business.timezone,
    "dd/MM/yyyy 'as' HH:mm",
  );

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-4 text-xl font-semibold text-green-700">
        Agendamento confirmado!
      </h1>
      <div className="rounded border p-4 text-left">
        <p>
          <strong>Servico:</strong> {service?.name}
        </p>
        <p>
          <strong>Data e hora:</strong> {when}
        </p>
        <p>
          <strong>Profissional:</strong> {business.name}
        </p>
        {business.defaultMessage && (
          <p className="mt-2 text-sm text-gray-600">{business.defaultMessage}</p>
        )}
      </div>
      <Link href={`/${slug}/meus-agendamentos`} className="mt-6 block text-sm underline">
        Ver meus agendamentos
      </Link>
    </main>
  );
}
