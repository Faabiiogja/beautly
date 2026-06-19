import { ActiveBadge } from "@/components/status-badge";
import { requirePlatformAdmin } from "@/lib/auth-guard";
import { listProfessionals } from "@/services/professional-service";
import Link from "next/link";
import { toggleStatusAction } from "./actions";

export default async function PlatformHome() {
  await requirePlatformAdmin();
  const professionals = await listProfessionals();

  return (
    <main>
      <div className="flex items-center justify-between gap-3">
        <h1 className="page-title">Profissionais</h1>
        <Link href="/platform/professionals/new" className="btn-primary">
          Nova profissional
        </Link>
      </div>

      <ul className="mt-6 space-y-3">
        {professionals.map((professional) => (
          <li
            key={professional.id}
            className="card flex items-center justify-between gap-3 p-4"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 font-display text-base font-semibold text-ink-900">
                {professional.name}
                <ActiveBadge status={professional.status} />
              </p>
              <p className="mt-0.5 text-sm text-ink-500">
                <Link
                  href={`/${professional.slug}`}
                  target="_blank"
                  className="font-medium text-brand-700 hover:underline"
                >
                  /{professional.slug}
                </Link>
                {professional.users[0] && (
                  <span> · {professional.users[0].email}</span>
                )}
              </p>
            </div>
            <form action={toggleStatusAction}>
              <input type="hidden" name="businessId" value={professional.id} />
              <input
                type="hidden"
                name="next"
                value={professional.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
              />
              <button className="btn-secondary whitespace-nowrap py-1.5 text-xs">
                {professional.status === "ACTIVE" ? "Inativar" : "Ativar"}
              </button>
            </form>
          </li>
        ))}
        {professionals.length === 0 && (
          <li className="alert-info">Nenhuma profissional cadastrada ainda.</li>
        )}
      </ul>
    </main>
  );
}
