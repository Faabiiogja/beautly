import { requireProfessional } from "@/lib/auth-guard";
import { listServices } from "@/services/service-catalog";
import {
  createServiceAction,
  toggleServiceAction,
  updateServiceAction,
} from "./actions";

export default async function ServicesPage() {
  const session = await requireProfessional();
  const services = await listServices(session.businessId!);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Servicos</h1>

      <form action={createServiceAction} className="mb-8 flex flex-wrap gap-2">
        <input name="name" placeholder="Nome" required className="rounded border p-2" />
        <input name="price" type="number" placeholder="Preco (R$)" required min={0} className="w-28 rounded border p-2" />
        <input name="durationMinutes" type="number" placeholder="Min" required min={5} className="w-24 rounded border p-2" />
        <button className="rounded bg-black px-4 text-white">Adicionar</button>
      </form>

      <ul className="space-y-3">
        {services.map((service) => (
          <li key={service.id} className="rounded border p-3">
            <form action={updateServiceAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={service.id} />
              <input name="name" defaultValue={service.name} className="rounded border p-1" />
              <input name="price" type="number" defaultValue={service.price} className="w-24 rounded border p-1" />
              <input name="durationMinutes" type="number" defaultValue={service.durationMinutes} className="w-20 rounded border p-1" />
              <button className="rounded border px-3 py-1 text-sm">Salvar</button>
            </form>
            <form action={toggleServiceAction} className="mt-2">
              <input type="hidden" name="id" value={service.id} />
              <input type="hidden" name="active" value={(!service.active).toString()} />
              <button className="text-sm underline">
                {service.active ? "Inativar" : "Ativar"} · status atual: {service.active ? "ativo" : "inativo"}
              </button>
            </form>
          </li>
        ))}
        {services.length === 0 && (
          <li className="text-sm text-gray-500">Nenhum servico ainda.</li>
        )}
      </ul>
    </main>
  );
}
