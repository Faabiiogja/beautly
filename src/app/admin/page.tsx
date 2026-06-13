import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness, isBusinessReady } from "@/services/business-service";
import Link from "next/link";

export default async function AdminHome() {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  const ready = await isBusinessReady(business.id);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-xl font-semibold">{business.name}</h1>
      {!ready && (
        <p className="mb-4 rounded bg-yellow-100 p-3 text-sm">
          Sua pagina ainda nao esta pronta. Confira: status ativo, telefone, ao
          menos um servico ativo e um dia da semana aberto.
        </p>
      )}
      <nav className="grid gap-3">
        <Link href="/admin/agenda" className="rounded border p-3">
          Agenda
        </Link>
        <Link href="/admin/services" className="rounded border p-3">
          Servicos
        </Link>
        <Link href="/admin/business" className="rounded border p-3">
          Dados do negocio
        </Link>
        <Link href="/admin/business/hours" className="rounded border p-3">
          Horarios
        </Link>
        <p className="text-sm text-gray-500">
          Link publico: <code>/{business.slug}</code>
        </p>
      </nav>
      <form action="/admin/logout" method="post" className="mt-6">
        <button className="text-sm text-gray-500 underline">Sair</button>
      </form>
    </main>
  );
}
