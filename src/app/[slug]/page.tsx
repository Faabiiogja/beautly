import { findBusinessBySlug } from "@/repositories/business-repository";
import { listActiveServices } from "@/services/service-catalog";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBusinessBySlug(slug);
  if (!business) notFound();

  if (business.status !== "ACTIVE") {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">{business.name}</h1>
        <p className="mt-4 rounded bg-gray-100 p-4 text-sm">
          Os agendamentos nao estao disponiveis no momento.
        </p>
      </main>
    );
  }

  const services = await listActiveServices(business.id);

  return (
    <main className="mx-auto max-w-md p-8">
      <header className="mb-6 flex items-center gap-3">
        {business.logoUrl && (
          <Image
            src={business.logoUrl}
            alt=""
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover"
          />
        )}
        <div>
          <h1 className="text-xl font-semibold">{business.name}</h1>
          <p className="text-sm text-gray-500">{business.contactPhone}</p>
        </div>
      </header>

      {business.defaultMessage && (
        <p className="mb-6 rounded bg-gray-50 p-3 text-sm">
          {business.defaultMessage}
        </p>
      )}

      {services.length === 0 ? (
        <p className="rounded bg-gray-100 p-4 text-sm">
          Nao ha servicos disponiveis no momento.
        </p>
      ) : (
        <>
          <h2 className="mb-3 font-medium">Servicos</h2>
          <ul className="space-y-2">
            {services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/${slug}/agendar?serviceId=${service.id}`}
                  className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
                >
                  <span>{service.name}</span>
                  <span className="text-sm text-gray-500">
                    R$ {service.price} · {service.durationMinutes}min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link
        href={`/${slug}/meus-agendamentos`}
        className="mt-8 block text-center text-sm underline"
      >
        Meus agendamentos
      </Link>
    </main>
  );
}
