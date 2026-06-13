import Link from "next/link";

const steps = [
  {
    title: "Monte sua página",
    description:
      "Cadastre seus serviços com preço e duração e defina os dias e horários em que você atende.",
  },
  {
    title: "Divulgue seu link",
    description:
      "Compartilhe sua página de agendamento no WhatsApp, Instagram ou onde suas clientes estiverem.",
  },
  {
    title: "Receba agendamentos",
    description:
      "Suas clientes escolhem o horário sozinhas, sem troca de mensagens. Você só confere a agenda do dia.",
  },
];

const benefits = [
  "Página própria com seu nome e seus serviços",
  "Horários sempre atualizados, sem marcação duplicada",
  "Cliente cancela e remarca sozinha, sem te interromper",
  "Confirmação de telefone por código para evitar erros",
  "Agenda do dia em uma tela só",
  "Feche dias de folga com um toque",
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="font-display text-2xl font-semibold text-brand-700">
            Beautly
          </span>
          <Link href="/admin/login" className="btn-secondary">
            Sou profissional
          </Link>
        </div>
      </header>

      <main className="flex-1">
        <section className="bg-gradient-to-b from-brand-50 to-zinc-50">
          <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
            <h1 className="font-display mx-auto max-w-2xl text-4xl font-semibold leading-tight text-zinc-900 sm:text-5xl">
              Sua agenda de beleza, <span className="text-brand-600">organizada</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-zinc-600">
              O Beautly é a agenda online feita para manicures, lash designers,
              sobrancelhas, depilação, cabelo e maquiagem. Chega de marcar
              horário por mensagem: sua cliente agenda sozinha pelo seu link.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/admin/login" className="btn-primary px-6 py-3 text-base">
                Acessar meu painel
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl px-6 py-16">
          <h2 className="font-display text-center text-3xl font-semibold text-zinc-900">
            Como funciona
          </h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="card text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 font-display text-lg font-semibold text-brand-700">
                  {index + 1}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto w-full max-w-5xl px-6 py-16">
            <div className="grid items-center gap-10 sm:grid-cols-2">
              <div>
                <h2 className="font-display text-3xl font-semibold text-zinc-900">
                  Feito para quem atende sozinha
                </h2>
                <p className="mt-4 text-zinc-600">
                  Sem sistema complicado, sem planilha, sem caderno. Só o que
                  você precisa para parecer ainda mais profissional.
                </p>
                <ul className="mt-6 space-y-3">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-zinc-700">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card border-brand-200 bg-brand-50/50 text-center">
                <p className="text-sm font-medium uppercase tracking-wide text-brand-700">
                  Mensalidade única
                </p>
                <p className="font-display mt-3 text-5xl font-semibold text-zinc-900">
                  R$ 30
                  <span className="text-base font-normal text-zinc-500">/mês</span>
                </p>
                <p className="mt-3 text-sm text-zinc-600">
                  Sem taxa por agendamento, sem fidelidade, sem surpresa.
                </p>
                <p className="mt-6 text-sm text-zinc-600">
                  Quer testar? Fale com a gente e participe do piloto.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-6 text-sm text-zinc-500">
          <span>© {new Date().getFullYear()} Beautly</span>
          <Link href="/admin/login" className="hover:text-brand-700">
            Área da profissional
          </Link>
        </div>
      </footer>
    </div>
  );
}
