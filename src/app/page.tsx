import Link from "next/link";

// ───────────────────────────────────────────────────────────────────────────
// CONFIGURAÇÃO DE CONVERSÃO
// Troque pelo seu WhatsApp (DDI + DDD + número, só dígitos) para ativar a
// captação de leads. Enquanto vazio, o CTA leva ao bloco final da página.
// ───────────────────────────────────────────────────────────────────────────
const WHATSAPP_NUMBER = "";
const START_URL = WHATSAPP_NUMBER
  ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      "Oi! Vim do site e quero criar minha página de agendamento no Beautly.",
    )}`
  : "#comecar";

const pains = [
  {
    title: "Mensagem às 23h",
    body: "A cliente te chama de madrugada perguntando se tem horário. Se você dormiu, perdeu.",
  },
  {
    title: "Horário dobrado",
    body: "Você cruza conversas e acaba marcando duas pessoas no mesmo slot. Stress na hora de remanejar.",
  },
  {
    title: "Esqueceu de responder",
    body: "O contato ficou lá embaixo no WhatsApp. Quando você viu, a cliente já foi com a concorrente.",
  },
  {
    title: "Dia inteiro no celular",
    body: "Você atendeu o dia todo — mas passou horas marcando, confirmando e remarcando horário.",
  },
];

const steps = [
  {
    n: "01",
    title: "Monte sua página",
    body: "Cadastre serviços, preços e horários. Leva cinco minutos pelo celular.",
  },
  {
    n: "02",
    title: "Compartilhe o link",
    body: "Coloque na bio do Instagram, no status do WhatsApp, no cartão de visitas.",
  },
  {
    n: "03",
    title: "Receba os agendamentos",
    body: "A cliente escolhe sozinha. Você só abre a agenda de manhã e vê quem vem.",
  },
];

const benefits = [
  {
    title: "Página com a sua cara",
    body: "Seu nome, seus serviços, sua logo. Profissional do primeiro ao último clique.",
    span: "lg:col-span-2",
  },
  {
    title: "Horário sempre certo",
    body: "Disponibilidade atualizada em tempo real. Nunca mais marque duas vezes.",
    span: "",
  },
  {
    title: "Confirmação por código",
    body: "A cliente valida o telefone com um OTP. Menos furo, menos erro de digitação.",
    span: "",
  },
  {
    title: "Cancela e remarca sozinha",
    body: "Sem te interromper no meio de um atendimento. Você só vê o resultado na agenda.",
    span: "lg:col-span-2",
  },
];

const faqs = [
  {
    q: "Preciso de computador?",
    a: "Não. Tudo funciona no celular — o painel e a página das suas clientes.",
  },
  {
    q: "Minha cliente precisa baixar algum app?",
    a: "Não. É só um link. Abre direto no navegador do celular dela, sem instalação.",
  },
  {
    q: "E se eu já atendo só no WhatsApp?",
    a: "O Beautly complementa. Quem prefere marcar sozinha, usa o link; as demais, você continua atendendo normalmente.",
  },
  {
    q: "Funciona para a minha área?",
    a: "Manicure, lash, sobrancelha, depilação, cabelo, maquiagem, estética. Qualquer serviço por horário.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Sem fidelidade, sem multa. Você fica só enquanto valer a pena para você.",
  },
];

function Check({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 10.5l3.5 3.5L16 5.5" />
    </svg>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5c.9 5.2 3.4 7.7 8.6 8.6-5.2.9-7.7 3.4-8.6 8.6-.9-5.2-3.4-7.7-8.6-8.6 5.2-.9 7.7-3.4 8.6-8.6Z" />
    </svg>
  );
}

// Mockup de phone mostrando a página de agendamento (hero visual).
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[270px] sm:w-[300px]">
      {/* Blob de fundo */}
      <div
        className="absolute -inset-8 -z-10 rounded-full opacity-60 blur-2xl"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 30%, #fbcfe8, transparent 60%), radial-gradient(circle at 70% 70%, #ddd6fe, transparent 60%)",
        }}
      />
      {/* Toast flutuante */}
      <div className="absolute -left-4 top-16 z-20 flex items-center gap-2 rounded-2xl bg-white/95 px-3 py-2 text-xs font-semibold text-ink-900 shadow-xl ring-1 ring-cream-200 backdrop-blur sm:-left-10">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-3.5 w-3.5" />
        </span>
        Novo agendamento confirmado
      </div>
      {/* Phone body */}
      <div className="rounded-[2.75rem] bg-ink-900 p-2.5 shadow-2xl ring-1 ring-black/10">
        <div className="overflow-hidden rounded-[2.25rem] bg-white">
          {/* Header da página */}
          <div
            className="px-5 pb-6 pt-7 text-center text-white"
            style={{
              backgroundImage:
                "linear-gradient(150deg, #ec4899 0%, #d6409f 45%, #a78bfa 115%)",
            }}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white font-display text-lg font-semibold text-brand-700 shadow-lg">
              M
            </span>
            <p className="mt-2 font-display text-base font-semibold">Maria Nails</p>
            <p className="text-[11px] text-white/80">Manicure · Sobrancelha</p>
          </div>
          {/* Conteúdo */}
          <div className="space-y-3 px-4 py-4">
            <div className="rounded-2xl border border-cream-200 bg-cream-50 p-3">
              <p className="text-[13px] font-semibold text-ink-900">
                Manicure + Pedicure
              </p>
              <div className="mt-1 flex items-center justify-between text-[11px] text-ink-500">
                <span>1h 30min</span>
                <span className="font-display text-sm font-semibold text-brand-700">
                  R$ 80
                </span>
              </div>
            </div>
            <p className="text-[11px] font-semibold text-ink-700">Horários</p>
            <div className="grid grid-cols-3 gap-1.5">
              {["09:00", "10:30", "14:00", "15:30", "16:00", "17:30"].map(
                (slot, i) => (
                  <span
                    key={slot}
                    className={
                      i === 2
                        ? "rounded-lg py-1.5 text-center text-[11px] font-semibold text-white"
                        : "rounded-lg border border-cream-200 bg-white py-1.5 text-center text-[11px] font-medium text-ink-700"
                    }
                    style={
                      i === 2
                        ? { backgroundImage: "linear-gradient(135deg,#ec4899,#a855f7)" }
                        : undefined
                    }
                  >
                    {slot}
                  </span>
                ),
              )}
            </div>
            <div
              className="mt-1 rounded-xl py-2.5 text-center text-[12px] font-semibold text-white"
              style={{ backgroundImage: "linear-gradient(135deg,#ec4899,#a855f7)" }}
            >
              Confirmar agendamento
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-cream-50">
      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-cream-200/70 bg-cream-50/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
          <span className="font-display text-xl font-semibold tracking-tight text-ink-900">
            Beautly
          </span>
          <nav className="flex items-center gap-1.5 sm:gap-3">
            <Link
              href="#preco"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition hover:text-brand-700 sm:inline-block"
            >
              Preço
            </Link>
            <Link
              href="#faq"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-700 transition hover:text-brand-700 sm:inline-block"
            >
              Dúvidas
            </Link>
            <Link
              href="/admin/login"
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-ink-700 transition hover:text-brand-700"
            >
              Entrar
            </Link>
            <a
              href={START_URL}
              className="btn-primary px-4 py-2 text-sm"
            >
              Começar
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-16 lg:grid-cols-2 lg:gap-8 lg:pb-24 lg:pt-20">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 shadow-sm">
                <Sparkle className="h-3.5 w-3.5 text-lilac-500" />
                Agenda online para profissionais de beleza
              </span>
              <h1 className="font-serif mt-5 text-[2.6rem] font-semibold leading-[1.05] tracking-[-0.02em] text-ink-900 sm:text-6xl lg:text-[4.2rem]">
                Suas clientes agendam{" "}
                <span className="relative inline-block">
                  <em className="not-italic text-brand-600">sozinhas</em>
                  <svg
                    className="absolute -bottom-1.5 left-0 h-2.5 w-full text-lilac-400"
                    viewBox="0 0 200 10"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <path
                      d="M2 7c40-5 120-5 196 0"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </span>
                . Você só atende.
              </h1>
              <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-ink-700 lg:mx-0">
                Crie sua página de agendamento em minutos. A cliente escolhe o
                horário pelo link — sem troca de mensagem, sem fila de espera,
                sem horário perdido. Funciona 24 horas, mesmo enquanto você
                atende ou descansa.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start lg:justify-start">
                <a href={START_URL} className="btn-primary w-full px-7 py-3.5 text-base sm:w-auto">
                  Criar minha página
                </a>
                <Link
                  href="#como-funciona"
                  className="btn-secondary w-full px-6 py-3.5 text-base sm:w-auto"
                >
                  Ver como funciona
                </Link>
              </div>
              <p className="mt-4 text-sm text-ink-500">
                Sem taxa por agendamento · R$30/mês · cancele quando quiser
              </p>
            </div>
            <div className="lg:pl-6">
              <PhoneMockup />
            </div>
          </div>
        </section>

        {/* DOR */}
        <section className="border-y border-cream-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-label">Por que mudar</p>
              <h2 className="font-serif mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Quanto tempo você perde marcando horário?
              </h2>
              <p className="mt-4 text-ink-700">
                Se a sua rotina parece com alguma dessas, o Beautly foi feito
                para você.
              </p>
            </div>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {pains.map((p) => (
                <div
                  key={p.title}
                  className="rounded-3xl border border-cream-200 bg-cream-50 p-5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4.5 w-4.5" aria-hidden>
                      <path strokeLinecap="round" d="M12 8v5M12 16.5v.01" />
                      <circle cx="12" cy="12" r="9" />
                    </svg>
                  </span>
                  <h3 className="mt-3.5 text-sm font-semibold text-ink-900">
                    {p.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-label">Simples assim</p>
              <h2 className="font-serif mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Três passos. Zero complicação.
              </h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.n} className="relative text-center md:text-left">
                  <span className="font-serif text-6xl font-semibold text-brand-200">
                    {s.n}
                  </span>
                  <h3 className="font-display mt-2 text-xl font-semibold text-ink-900">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-ink-700">
                    {s.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS — bento */}
        <section className="border-y border-cream-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-label">Tudo incluído</p>
              <h2 className="font-serif mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                O que você precisa. Nada do que não vai usar.
              </h2>
            </div>
            <div className="mt-12 grid auto-rows-fr gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b) => (
                <div
                  key={b.title}
                  className={`group rounded-3xl border border-cream-200 bg-cream-50 p-6 transition hover:border-brand-200 hover:bg-white hover:shadow-glow ${b.span}`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-lilac-400 text-white">
                    <Check className="h-5 w-5" />
                  </span>
                  <h3 className="font-display mt-4 text-lg font-semibold text-ink-900">
                    {b.title}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-ink-700">
                    {b.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PREÇO */}
        <section id="preco" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="mx-auto max-w-2xl text-center">
              <p className="section-label">Preço justo</p>
              <h2 className="font-serif mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Um valor. Sem pegadinhas.
              </h2>
            </div>
            <div className="mx-auto mt-10 max-w-md">
              <div className="relative overflow-hidden rounded-[2rem] border border-brand-200 bg-white p-8 text-center shadow-glow">
                <div
                  className="absolute inset-x-0 top-0 h-1.5"
                  style={{ backgroundImage: "linear-gradient(90deg,#ec4899,#a855f7)" }}
                />
                <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">
                   Beautly
                </p>
                <div className="mt-4 flex items-end justify-center gap-1">
                  <span className="font-serif text-6xl font-semibold text-ink-900">
                    R$ 30
                  </span>
                  <span className="mb-2 text-base font-medium text-ink-500">
                    /mês
                  </span>
                </div>
                <p className="mt-2 text-sm text-ink-500">
                  Sem taxa por agendamento. Sem fidelidade.
                </p>
                <ul className="mx-auto mt-6 space-y-2.5 text-left text-[15px] text-ink-700">
                  {[
                    "Página de agendamento ilimitada",
                    "Agendamentos ilimitados",
                    "Confirmação por telefone (anti-furo)",
                    "Agenda do dia, folgas e feriados",
                    "Cancele a qualquer momento",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check className="mt-0.5 h-4.5 w-4.5 shrink-0 text-lilac-600" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={START_URL}
                  className="btn-primary mt-7 w-full px-6 py-3.5 text-base"
                >
                  Começar agora
                </a>
                <p className="mt-3 text-xs text-ink-500">
                  No piloto agora: fale com a gente para liberar sua conta.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-20 border-t border-cream-200 bg-white">
          <div className="mx-auto w-full max-w-3xl px-5 py-16 sm:px-8 sm:py-24">
            <div className="text-center">
              <p className="section-label">Dúvidas frequentes</p>
              <h2 className="font-serif mt-3 text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Tudo que você pode estar se perguntando
              </h2>
            </div>
            <dl className="mt-10 divide-y divide-cream-200">
              {faqs.map((f) => (
                <div key={f.q} className="py-5">
                  <dt className="font-display text-[17px] font-semibold text-ink-900">
                    {f.q}
                  </dt>
                  <dd className="mt-1.5 text-[15px] leading-relaxed text-ink-700">
                    {f.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* CTA FINAL */}
        <section id="comecar" className="scroll-mt-20">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
            <div
              className="relative overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 sm:py-20"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #ec4899 0%, #d6409f 50%, #a855f7 120%)",
              }}
            >
              <Sparkle className="mx-auto h-7 w-7 text-white/80" />
              <h2 className="font-serif mx-auto mt-4 max-w-xl text-3xl font-semibold leading-tight text-white sm:text-[2.6rem]">
                Suas clientes estão te esperando.
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-white/90">
                Monte sua página hoje e pare de perder tempo — e cliente — no
                WhatsApp.
              </p>
              <a
                href={START_URL}
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-brand-700 shadow-xl transition hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Criar minha página
              </a>
              <p className="mt-4 text-sm text-white/80">
                R$30/mês · sem taxa por agendamento · cancele quando quiser
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-cream-200 bg-cream-100">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-5 py-8 text-sm text-ink-500 sm:flex-row sm:px-8">
          <div className="flex items-center gap-2">
            <span className="font-display text-base font-semibold text-ink-900">
              Beautly
            </span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/admin/login" className="hover:text-brand-700">
              Área da profissional
            </Link>
            <a href="#faq" className="hover:text-brand-700">
              Dúvidas
            </a>
          </div>
        </div>
      </footer>

      {/* CTA MOBILE FIXO */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream-200 bg-cream-50/95 px-4 py-3 backdrop-blur-md sm:hidden">
        <a
          href={START_URL}
          className="btn-primary w-full px-6 py-3 text-base"
        >
          Criar minha página
        </a>
      </div>
      {/* Espaçador para o CTA fixo não cobrir conteúdo no mobile */}
      <div className="h-16 sm:hidden" aria-hidden />
    </div>
  );
}
