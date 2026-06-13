import { requireProfessional } from "@/lib/auth-guard";
import { todayLocalDateStr } from "@/lib/timezone";
import { listAppointmentsByDay } from "@/services/agenda-service";
import { businessReadiness, getBusiness } from "@/services/business-service";
import Link from "next/link";
import { CopyLink } from "./copy-link";

const checklist: {
  key: "active" | "hasContact" | "hasActiveService" | "hasOpenDay";
  label: string;
  href: string;
}[] = [
  { key: "active", label: "Conta ativa na plataforma", href: "/admin" },
  { key: "hasContact", label: "Nome e telefone do negócio", href: "/admin/business" },
  { key: "hasActiveService", label: "Pelo menos um serviço ativo", href: "/admin/services" },
  { key: "hasOpenDay", label: "Pelo menos um dia da semana aberto", href: "/admin/business/hours" },
];

export default async function AdminHome() {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  const readiness = await businessReadiness(business.id);
  const today = todayLocalDateStr(business.timezone);
  const todayAppointments = await listAppointmentsByDay(
    business.id,
    today,
    business.timezone,
  );

  return (
    <main>
      <h1 className="font-display text-2xl font-semibold text-zinc-900">
        Olá, {business.name}
      </h1>

      {readiness.ready ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-brand-50/50 p-4">
          <div>
            <p className="font-medium text-zinc-900">
              Sua página está no ar ✨
            </p>
            <p className="mt-0.5 text-sm text-zinc-600">
              Divulgue o link para suas clientes agendarem sozinhas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-lg bg-white px-2 py-1 text-xs text-brand-700">
              /{business.slug}
            </code>
            <CopyLink path={`/${business.slug}`} />
          </div>
        </div>
      ) : (
        <div className="card mt-6 border-amber-200 bg-amber-50/60 p-4">
          <p className="font-medium text-zinc-900">
            Sua página ainda não está pronta
          </p>
          <p className="mt-0.5 text-sm text-zinc-600">
            Complete os passos abaixo para começar a receber agendamentos:
          </p>
          <ul className="mt-3 space-y-2">
            {checklist.map((item) => {
              const done = readiness[item.key];
              return (
                <li key={item.key} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                      done
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-zinc-200 text-zinc-500"
                    }`}
                  >
                    {done ? "✓" : "•"}
                  </span>
                  {done ? (
                    <span className="text-zinc-500 line-through">{item.label}</span>
                  ) : (
                    <Link href={item.href} className="text-brand-700 hover:underline">
                      {item.label}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Hoje
          </h2>
          <Link href="/admin/agenda" className="text-sm text-brand-700 hover:underline">
            Ver agenda completa
          </Link>
        </div>
        {todayAppointments.length === 0 ? (
          <p className="alert-info mt-3">Nenhum atendimento marcado para hoje.</p>
        ) : (
          <p className="card mt-3 p-4 text-sm text-zinc-700">
            Você tem{" "}
            <strong className="text-brand-700">
              {todayAppointments.length}
            </strong>{" "}
            atendimento{todayAppointments.length > 1 ? "s" : ""} hoje.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        <Link href="/admin/agenda" className="card p-4 transition hover:border-brand-300">
          <p className="font-medium text-zinc-900">Agenda</p>
          <p className="mt-1 text-sm text-zinc-500">
            Veja os atendimentos por dia e feche dias de folga.
          </p>
        </Link>
        <Link href="/admin/services" className="card p-4 transition hover:border-brand-300">
          <p className="font-medium text-zinc-900">Serviços</p>
          <p className="mt-1 text-sm text-zinc-500">
            Cadastre serviços com preço e duração.
          </p>
        </Link>
        <Link href="/admin/business/hours" className="card p-4 transition hover:border-brand-300">
          <p className="font-medium text-zinc-900">Horários</p>
          <p className="mt-1 text-sm text-zinc-500">
            Defina os dias e horários em que você atende.
          </p>
        </Link>
        <Link href="/admin/business" className="card p-4 transition hover:border-brand-300">
          <p className="font-medium text-zinc-900">Dados do negócio</p>
          <p className="mt-1 text-sm text-zinc-500">
            Nome, telefone, mensagem padrão e logotipo.
          </p>
        </Link>
      </section>
    </main>
  );
}
