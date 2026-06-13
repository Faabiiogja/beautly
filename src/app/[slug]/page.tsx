import { formatPhone, whatsappLink } from "@/lib/phone";
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
      <main className="mx-auto w-full max-w-md flex-1 px-6 py-12">
        <div className="card text-center">
          <h1 className="font-display text-2xl font-semibold text-ink-900">
            {business.name}
          </h1>
          <p className="alert-info mt-6">
            Os agendamentos não estão disponíveis no momento.
          </p>
        </div>
      </main>
    );
  }

  const services = await listActiveServices(business.id);

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-6 py-10">
      <header className="card flex items-center gap-5">
        {business.logoUrl ? (
          <Image
            src={business.logoUrl}
            alt={`Logo de ${business.name}`}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-100"
          />
        ) : (
          <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-lilac-400 font-display text-3xl font-semibold text-white">
            {business.name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h1 className="font-display truncate text-2xl font-semibold text-ink-900">
            {business.name}
          </h1>
          <a
            href={whatsappLink(business.contactPhone)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-700 hover:underline"
          >
            {formatPhone(business.contactPhone)}
          </a>
        </div>
      </header>

      {business.defaultMessage && (
        <p className="alert-info mt-4">{business.defaultMessage}</p>
      )}

      <section className="mt-8">
        <h2 className="section-label mb-3">Escolha um serviço</h2>
        {services.length === 0 ? (
          <p className="alert-info">Não há serviços disponíveis no momento.</p>
        ) : (
          <ul className="space-y-3">
            {services.map((service) => (
              <li key={service.id}>
                <Link
                  href={`/${slug}/agendar?serviceId=${service.id}`}
                  className="card flex items-center justify-between gap-3 p-4 transition hover:-translate-y-0.5 hover:border-lilac-300 hover:shadow"
                >
                  <div>
                    <p className="font-medium text-ink-900">{service.name}</p>
                    <p className="mt-0.5 text-sm text-ink-500">
                      {service.durationMinutes} min
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-600">
                      R$ {service.price}
                    </span>
                    <svg
                      className="h-5 w-5 text-lilac-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.2 14.8a1 1 0 0 1 0-1.4L10.6 10 7.2 6.6a1 1 0 1 1 1.4-1.4l4.1 4.1a1 1 0 0 1 0 1.4l-4.1 4.1a1 1 0 0 1-1.4 0Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href={`/${slug}/meus-agendamentos`}
        className="btn-secondary mt-8 w-full"
      >
        Ver meus agendamentos
      </Link>

      <p className="mt-10 text-center text-xs text-ink-500">
        Agenda online por{" "}
        <span className="font-semibold text-brand-600">Beautly</span>
      </p>
    </main>
  );
}
