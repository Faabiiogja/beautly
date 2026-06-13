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
    <main>
      <h1 className="font-display text-2xl font-semibold text-zinc-900">
        Serviços
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Só serviços ativos aparecem para suas clientes. Use nomes claros, como
        “Manicure simples” ou “Design de sobrancelha”.
      </p>

      <form action={createServiceAction} className="card mt-6 p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Novo serviço
        </h2>
        <div className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
          <div>
            <label htmlFor="new-name" className="field-label">
              Nome
            </label>
            <input
              id="new-name"
              name="name"
              placeholder="Manicure simples"
              required
              className="input"
            />
          </div>
          <div>
            <label htmlFor="new-price" className="field-label">
              Preço (R$)
            </label>
            <input
              id="new-price"
              name="price"
              type="number"
              placeholder="30"
              required
              min={0}
              className="input"
            />
          </div>
          <div>
            <label htmlFor="new-duration" className="field-label">
              Duração (min)
            </label>
            <input
              id="new-duration"
              name="durationMinutes"
              type="number"
              placeholder="40"
              required
              min={5}
              step={5}
              className="input"
            />
          </div>
          <div className="flex items-end">
            <button className="btn-primary w-full">Adicionar</button>
          </div>
        </div>
      </form>

      <ul className="mt-6 space-y-3">
        {services.map((service) => (
          <li key={service.id} className="card p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span
                className={`badge ${
                  service.active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-zinc-100 text-zinc-500"
                }`}
              >
                {service.active ? "Ativo" : "Inativo"}
              </span>
              <form action={toggleServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <input
                  type="hidden"
                  name="active"
                  value={(!service.active).toString()}
                />
                <button className="text-sm text-brand-700 hover:underline">
                  {service.active ? "Inativar" : "Ativar"}
                </button>
              </form>
            </div>
            <form
              action={updateServiceAction}
              className="grid gap-3 sm:grid-cols-[1fr_8rem_8rem_auto]"
            >
              <input type="hidden" name="id" value={service.id} />
              <div>
                <label htmlFor={`name-${service.id}`} className="sr-only">
                  Nome
                </label>
                <input
                  id={`name-${service.id}`}
                  name="name"
                  defaultValue={service.name}
                  required
                  className="input"
                />
              </div>
              <div>
                <label htmlFor={`price-${service.id}`} className="sr-only">
                  Preço
                </label>
                <input
                  id={`price-${service.id}`}
                  name="price"
                  type="number"
                  min={0}
                  defaultValue={service.price}
                  required
                  className="input"
                />
              </div>
              <div>
                <label htmlFor={`duration-${service.id}`} className="sr-only">
                  Duração
                </label>
                <input
                  id={`duration-${service.id}`}
                  name="durationMinutes"
                  type="number"
                  min={5}
                  step={5}
                  defaultValue={service.durationMinutes}
                  required
                  className="input"
                />
              </div>
              <div className="flex items-end">
                <button className="btn-secondary w-full">Salvar</button>
              </div>
            </form>
          </li>
        ))}
        {services.length === 0 && (
          <li className="alert-info">
            Nenhum serviço ainda. Cadastre o primeiro acima.
          </li>
        )}
      </ul>
    </main>
  );
}
