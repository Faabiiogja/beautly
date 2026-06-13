import { requirePlatformAdmin } from "@/lib/auth-guard";
import { listProfessionals } from "@/services/professional-service";
import Link from "next/link";
import { toggleStatusAction } from "./actions";

export default async function PlatformHome() {
  await requirePlatformAdmin();
  const professionals = await listProfessionals();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <Link
          href="/platform/professionals/new"
          className="rounded bg-black px-3 py-2 text-white"
        >
          Nova profissional
        </Link>
      </div>
      <ul className="divide-y">
        {professionals.map((professional) => (
          <li
            key={professional.id}
            className="flex items-center justify-between py-3"
          >
            <div>
              <p className="font-medium">{professional.name}</p>
              <p className="text-sm text-gray-500">
                /{professional.slug} · {professional.status}
              </p>
            </div>
            <form action={toggleStatusAction}>
              <input type="hidden" name="businessId" value={professional.id} />
              <input
                type="hidden"
                name="next"
                value={professional.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
              />
              <button className="rounded border px-3 py-1 text-sm">
                {professional.status === "ACTIVE" ? "Inativar" : "Ativar"}
              </button>
            </form>
          </li>
        ))}
        {professionals.length === 0 && (
          <li className="py-3 text-sm text-gray-500">
            Nenhuma profissional cadastrada.
          </li>
        )}
      </ul>
    </main>
  );
}
