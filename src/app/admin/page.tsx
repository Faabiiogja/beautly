import { CopyLink } from "@/app/admin/copy-link";
import { requireProfessional } from "@/lib/auth-guard";
import { todayLocalDateStr } from "@/lib/timezone";
import { listAppointmentsByDay } from "@/services/agenda-service";
import { businessReadiness, getBusiness } from "@/services/business-service";
import Link from "next/link";

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
      <h1 className="page-title">Olá, {business.name}</h1>

      {readiness.ready ? (
        <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 border-brand-200 bg-gradient-to-br from-brand-50 to-lilac-50 p-5">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold text-ink-900">
              Sua página está no ar ✨
            </p>
            <p className="mt-0.5 text-sm text-ink-500">
              Divulgue o link para suas clientes agendarem sozinhas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <code className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-200">
              /{business.slug}
            </code>
            <CopyLink path={`/${business.slug}`} />
          </div>
        </div>
      ) : (
        <div className="card mt-6 border-lilac-200 bg-gradient-to-br from-lilac-50 to-brand-50 p-5">
          <p className="font-display text-base font-semibold text-ink-900">
            Sua página ainda não está pronta
          </p>
          <p className="mt-0.5 text-sm text-ink-500">
            Complete os passos abaixo para começar a receber agendamentos:
          </p>
          <ul className="mt-4 space-y-2.5">
            {checklist.map((item) => {
              const done = readiness[item.key];
              return (
                <li key={item.key} className="flex items-center gap-2.5 text-sm">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      done
                        ? "bg-success-100 text-success-700"
                        : "bg-cream-200 text-ink-500"
                    }`}
                  >
                    {done ? "✓" : "•"}
                  </span>
                  {done ? (
                    <span className="text-ink-500 line-through">
                      {item.label}
                    </span>
                  ) : (
                    <Link
                      href={item.href}
                      className="font-medium text-brand-700 hover:underline"
                    >
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
          <h2 className="section-label">Hoje</h2>
          <Link
            href="/admin/agenda"
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            Ver agenda completa
          </Link>
        </div>
        {todayAppointments.length === 0 ? (
          <p className="alert-info mt-3">Nenhum atendimento marcado para hoje.</p>
        ) : (
          <p className="card mt-3 p-4 text-sm text-ink-700">
            Você tem{" "}
            <strong className="font-display text-brand-700">
              {todayAppointments.length}
            </strong>{" "}
            atendimento{todayAppointments.length > 1 ? "s" : ""} hoje.
          </p>
        )}
      </section>

      <section className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          {
            href: "/admin/agenda",
            title: "Agenda",
            desc: "Veja os atendimentos por dia e feche dias de folga.",
          },
          {
            href: "/admin/services",
            title: "Serviços",
            desc: "Cadastre serviços com preço e duração.",
          },
          {
            href: "/admin/business/hours",
            title: "Horários",
            desc: "Defina os dias e horários em que você atende.",
          },
          {
            href: "/admin/business",
            title: "Dados do negócio",
            desc: "Nome, telefone, mensagem padrão e logotipo.",
          },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="card p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-glow"
          >
            <p className="font-display text-base font-semibold text-ink-900">
              {card.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              {card.desc}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
