import {
  faqItems,
  featureCards,
  hero,
  platformBullets,
  stats,
  testimonials,
} from '@/app/_components/marketing/landing-data'

function OutlineButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-full border border-[#1d170f]/15 bg-white/70 px-5 py-3 text-sm font-medium text-[#1d170f] transition hover:border-[#1d170f]/30 hover:bg-white"
    >
      {children}
    </button>
  )
}

function SolidButton({ children }: { children: React.ReactNode }) {
  return (
    <button
      type="button"
      className="rounded-full bg-[#1d170f] px-5 py-3 text-sm font-medium text-[#f7efe5] transition hover:bg-[#32281d]"
    >
      {children}
    </button>
  )
}

export function BeautlyLandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5ede3] text-[#1d170f]">
      <section className="relative isolate overflow-hidden border-b border-[#1d170f]/10">
        <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(225,111,72,0.24),_transparent_60%)]" />
        <div className="mx-auto flex max-w-7xl flex-col gap-14 px-6 py-8 lg:px-10 lg:py-10">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#1d170f] text-center text-lg leading-10 text-[#f5ede3]">
                B
              </div>
              <div>
                <p className="text-base font-semibold">Beautly</p>
                <p className="text-sm text-[#1d170f]/60">SaaS para beleza</p>
              </div>
            </div>
            <nav className="hidden items-center gap-8 text-sm text-[#1d170f]/70 md:flex">
              <span>Produto</span>
              <span>Operacao</span>
              <span>Planos</span>
              <span>FAQ</span>
            </nav>
          </header>

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex rounded-full border border-[#1d170f]/10 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#1d170f]/65">
                {hero.eyebrow}
              </div>
              <div className="space-y-5">
                <h1 className="max-w-3xl text-balance text-5xl font-semibold tracking-[-0.06em] text-[#1d170f] md:text-7xl">
                  {hero.title}
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-[#1d170f]/70 md:text-xl">
                  {hero.description}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <SolidButton>{hero.primaryCta}</SolidButton>
                <OutlineButton>{hero.secondaryCta}</OutlineButton>
              </div>
              <div className="grid gap-4 border-t border-[#1d170f]/10 pt-6 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <p className="text-3xl font-semibold tracking-[-0.05em]">{stat.value}</p>
                    <p className="mt-2 text-sm text-[#1d170f]/60">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-8 top-10 hidden h-40 w-40 rounded-full bg-[#e8b38d]/40 blur-3xl lg:block" />
              <div className="relative rounded-[2rem] border border-[#1d170f]/10 bg-[#fcf8f3] p-4 shadow-[0_24px_80px_rgba(29,23,15,0.12)] md:p-6">
                <div className="rounded-[1.6rem] border border-[#1d170f]/10 bg-[#f8f2ea] p-4">
                  <div className="grid gap-4 lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="rounded-[1.4rem] bg-[#1d170f] p-5 text-[#f7efe5]">
                      <p className="text-xs uppercase tracking-[0.24em] text-[#f7efe5]/60">
                        Dashboard
                      </p>
                      <h2 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">
                        Tudo o que importa hoje
                      </h2>
                      <div className="mt-6 space-y-3">
                        {['Agenda do dia', 'Profissionais', 'Bloqueios', 'Confirmacoes'].map(
                          (item) => (
                            <div
                              key={item}
                              className="rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm"
                            >
                              {item}
                            </div>
                          )
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.4rem] bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-[#1d170f]/50">Hoje</p>
                            <p className="text-xl font-semibold">14 atendimentos</p>
                          </div>
                          <div className="rounded-full bg-[#e16f48]/12 px-3 py-1 text-xs font-semibold text-[#b45837]">
                            +18%
                          </div>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {[
                            'Escova modelada',
                            'Coloracao',
                            'Manicure premium',
                            'Design de sobrancelha',
                          ].map((service, index) => (
                            <div
                              key={service}
                              className="rounded-2xl border border-[#1d170f]/8 bg-[#f8f2ea] px-4 py-3"
                            >
                              <p className="text-xs text-[#1d170f]/45">0{index + 1}</p>
                              <p className="mt-2 text-sm font-medium">{service}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.4rem] bg-[#df6f49] p-5 text-[#fff5ee]">
                          <p className="text-xs uppercase tracking-[0.24em] text-[#fff5ee]/70">
                            Booking
                          </p>
                          <p className="mt-3 text-lg font-semibold">
                            Agendamentos fluem sem trocar dez mensagens.
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] border border-[#1d170f]/8 bg-white p-5">
                          <p className="text-xs uppercase tracking-[0.24em] text-[#1d170f]/45">
                            Tenant
                          </p>
                          <p className="mt-3 text-lg font-semibold">
                            Cada estudio com contexto e operacao isolados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-[#1d170f]/10 bg-[#f8f2ea]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 text-sm text-[#1d170f]/55 md:grid-cols-4 lg:px-10">
          {['STUDIO DEMO', 'GLOW HOUSE', 'ATELIE ROSA', 'BEAUTLY PILOT'].map((brand) => (
            <div key={brand} className="font-semibold tracking-[0.24em]">
              {brand}
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1d170f]/45">
              Operacao
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Menos atrito para a equipe. Mais clareza para crescer.
            </h2>
            <p className="max-w-xl text-base leading-7 text-[#1d170f]/68">
              A Beautly organiza a rotina comercial e operacional de um estudio com uma
              linguagem visual premium e uma estrutura pronta para evoluir.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-[1.8rem] border border-[#1d170f]/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(29,23,15,0.06)]"
              >
                <div className="h-12 w-12 rounded-2xl bg-[#1d170f] text-center text-lg leading-[3rem] text-[#f6efe5]">
                  +
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">
                  {card.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#1d170f]/65">
                  {card.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#1d170f] text-[#f6efe5]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f6efe5]/50">
              Plataforma
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              Uma base real para o produto comercial da v2.
            </h2>
            <p className="max-w-xl text-base leading-7 text-[#f6efe5]/68">
              Esta entrega reposiciona a raiz do app como pagina de marca e preserva a
              arquitetura multi-tenant para os fluxos que ja existem.
            </p>
          </div>
          <div className="space-y-4">
            {platformBullets.map((bullet) => (
              <div
                key={bullet}
                className="rounded-[1.6rem] border border-white/10 bg-white/6 px-5 py-5 text-base leading-7"
              >
                {bullet}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="grid gap-6 md:grid-cols-2">
          {testimonials.map((item) => (
            <article
              key={item.author}
              className="rounded-[1.8rem] border border-[#1d170f]/10 bg-[#fbf7f1] p-8"
            >
              <p className="text-xl leading-9 tracking-[-0.03em]">
                <span aria-hidden="true">&ldquo;</span>
                {item.quote}
                <span aria-hidden="true">&rdquo;</span>
              </p>
              <div className="mt-8">
                <p className="font-semibold">{item.author}</p>
                <p className="text-sm text-[#1d170f]/55">{item.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-[#1d170f]/10 bg-white/45">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-10">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1d170f]/45">
              FAQ
            </p>
            <h2 className="text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
              O que ja existe agora e o que fica para a v2.
            </h2>
          </div>
          <div className="space-y-4">
            {faqItems.map((item) => (
              <article
                key={item.question}
                className="rounded-[1.6rem] border border-[#1d170f]/10 bg-[#f8f2ea] px-6 py-6"
              >
                <h3 className="text-lg font-semibold">{item.question}</h3>
                <p className="mt-3 text-sm leading-7 text-[#1d170f]/65">{item.answer}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="rounded-[2rem] bg-[#df6f49] px-6 py-10 text-[#fff5ee] md:px-10 md:py-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#fff5ee]/70">
                Beautly
              </p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] md:text-5xl">
                A nova entrada publica do produto esta pronta para crescer.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <OutlineButton>{hero.secondaryCta}</OutlineButton>
              <button
                type="button"
                className="rounded-full bg-[#fff5ee] px-5 py-3 text-sm font-medium text-[#a94f33] transition hover:bg-white"
              >
                {hero.primaryCta}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
