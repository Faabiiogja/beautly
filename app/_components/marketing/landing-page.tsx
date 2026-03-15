import type { ReactNode } from 'react'
import {
  audiences,
  benefitImages,
  benefits,
  faqItems,
  features,
  footerColumns,
  hero,
  navItems,
  painPoints,
  steps,
  testimonials,
} from '@/app/_components/marketing/landing-data'
import {
  BadgeCheck,
  BellOff,
  BookOpen,
  Brush,
  CalendarDays,
  CheckSquare,
  Flower2,
  Globe,
  LayoutDashboard,
  Mail,
  MessageCircleMore,
  PlayCircle,
  Scissors,
  Share2,
  Sparkles,
  Star,
  Stethoscope,
  Users,
  WandSparkles,
  Zap,
} from 'lucide-react'

function iconFor(name: string) {
  const className = 'h-7 w-7'

  switch (name) {
    case 'chat':
      return <MessageCircleMore className={className} />
    case 'bell-off':
      return <BellOff className={className} />
    case 'book':
      return <BookOpen className={className} />
    case 'zap':
      return <Zap className={className} />
    case 'calendar':
      return <CalendarDays className={className} />
    case 'badge':
      return <BadgeCheck className={className} />
    case 'layout':
      return <LayoutDashboard className={className} />
    case 'checklist':
      return <CheckSquare className={className} />
    case 'mail':
      return <Mail className={className} />
    case 'users':
      return <Users className={className} />
    case 'briefcase-medical':
      return <Stethoscope className={className} />
    case 'sparkles':
      return <Sparkles className={className} />
    case 'scissors':
      return <Scissors className={className} />
    case 'flower':
      return <Flower2 className={className} />
    case 'brush':
      return <Brush className={className} />
    default:
      return <WandSparkles className={className} />
  }
}

function PrimaryButton({ children, rounded = 'xl' }: { children: ReactNode; rounded?: 'xl' | 'full' }) {
  const shape = rounded === 'full' ? 'rounded-full' : 'rounded-xl'

  return (
    <button
      type="button"
      className={`${shape} bg-[#ec4699] px-8 py-4 text-base font-bold text-white transition-all hover:bg-[#d93889] shadow-xl shadow-[#ec4699]/20`}
    >
      {children}
    </button>
  )
}

function OutlineButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="flex items-center justify-center gap-2 rounded-xl border border-[#ec4699]/20 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50"
    >
      {children}
    </button>
  )
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-16 text-center">
      <h2 className="text-3xl font-bold text-slate-900 lg:text-4xl">{title}</h2>
      {subtitle ? <p className="mt-4 text-slate-600">{subtitle}</p> : null}
    </div>
  )
}

export function BeautlyLandingPage() {
  return (
    <main className="min-h-screen bg-[#f8f6f7] font-[family-name:var(--font-geist-sans)] text-slate-900">
      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
        <header className="sticky top-0 z-50 w-full border-b border-[#ec4699]/10 bg-[#f8f6f7]/80 px-6 py-4 backdrop-blur-md lg:px-20">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ec4699] text-white">
                <WandSparkles className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">Beautly</span>
            </div>
            <nav className="hidden items-center gap-8 md:flex">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-sm font-medium transition-colors hover:text-[#ec4699]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <PrimaryButton rounded="full">{hero.topCta}</PrimaryButton>
          </div>
        </header>

        <section className="relative overflow-hidden px-6 pb-24 pt-16 lg:px-20 lg:pt-24">
          <div className="mx-auto max-w-7xl">
            <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
              <div className="flex flex-col gap-8">
                <div className="inline-flex w-fit items-center rounded-full bg-[#ec4699]/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-[#ec4699]">
                  {hero.badge}
                </div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 lg:text-6xl">
                  O sistema de agendamento ideal para{' '}
                  <span className="text-[#ec4699]">{hero.highlight}</span> de estética.
                </h1>
                <p className="text-lg leading-relaxed text-slate-600">{hero.description}</p>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <PrimaryButton>{hero.primaryCta}</PrimaryButton>
                  <OutlineButton>
                    <PlayCircle className="h-5 w-5" />
                    {hero.secondaryCta}
                  </OutlineButton>
                </div>
              </div>

              <div className="relative">
                <div className="relative z-10 overflow-hidden rounded-2xl border border-[#ec4699]/10 bg-white shadow-2xl">
                  <img
                    src={hero.heroImage}
                    alt="Dashboard administrativo moderno mostrando métricas e agenda de estética"
                    className="w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 -z-10 h-64 w-64 rounded-full bg-[#ec4699]/20 blur-3xl" />
                <div className="absolute -left-6 -top-6 -z-10 h-64 w-64 rounded-full bg-pink-200/40 blur-3xl" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              title="Diga adeus à desorganização"
              subtitle="Cansada do caos no WhatsApp e de clientes que esquecem o horário?"
            />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {painPoints.map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-[#ec4699]/5 bg-[#f8f6f7] p-8"
                >
                  <div className="mb-4 text-[#ec4699]">{iconFor(item.icon)}</div>
                  <h3 className="mb-2 text-xl font-bold">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="beneficios" className="px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-16 lg:flex-row lg:items-center">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold leading-tight lg:text-4xl">
                  Por que escolher a Beautly?
                </h2>
                <p className="mt-4 text-lg text-slate-600">
                  Desenvolvido especialmente para as necessidades únicas do mercado de beleza
                  e estética.
                </p>
                <div className="mt-10 space-y-8">
                  {benefits.map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#ec4699]/10 text-[#ec4699]">
                        {iconFor(item.icon)}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold">{item.title}</h4>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:w-1/2">
                <div className="space-y-4 pt-12">
                  <img
                    src={benefitImages[0]}
                    alt="Ambiente de clínica de estética limpo e luxuoso"
                    className="h-64 w-full rounded-2xl object-cover"
                  />
                  <img
                    src={benefitImages[1]}
                    alt="Profissional de estética realizando procedimento facial"
                    className="h-48 w-full rounded-2xl object-cover"
                  />
                </div>
                <div className="space-y-4">
                  <img
                    src={benefitImages[2]}
                    alt="Close up de maquiagem profissional"
                    className="h-48 w-full rounded-2xl object-cover"
                  />
                  <img
                    src={benefitImages[3]}
                    alt="Ferramentas de estética organizadas"
                    className="h-64 w-full rounded-2xl object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="bg-[#ec4699]/5 px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Comece em 3 passos simples" />
            <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
              {steps.map((step, index) => (
                <div key={step.title} className="flex flex-col items-center text-center">
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[#ec4699] text-2xl font-black text-white">
                    {index + 1}
                  </div>
                  <h3 className="mb-2 text-xl font-bold">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="funcionalidades" className="px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Tudo que você precisa em um só lugar" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-[#ec4699]/10 bg-white p-6 transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 block text-[#ec4699]">{iconFor(item.icon)}</div>
                  <h4 className="mb-2 font-bold">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#f8f6f7] px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Quem usa e recomenda" />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {testimonials.map((item) => (
                <article key={item.author} className="rounded-2xl bg-white p-8 shadow-sm">
                  <div className="mb-4 flex gap-1 text-[#ec4699]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={`${item.author}-${index}`} className="h-5 w-5 fill-current" />
                    ))}
                  </div>
                  <p className="mb-6 italic text-slate-600">&quot;{item.quote}&quot;</p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-200">
                      <img
                        src={item.image}
                        alt={`Foto de perfil de ${item.author}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h5 className="font-bold">{item.author}</h5>
                      <p className="text-xs text-slate-500">{item.role}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-7xl">
            <SectionHeading title="Perfeito para o seu negócio" />
            <div className="flex flex-wrap justify-center gap-8">
              {audiences.map((item) => (
                <div key={item.label} className="flex flex-col items-center gap-3">
                  <div className="flex h-24 w-24 cursor-default items-center justify-center rounded-2xl bg-[#ec4699]/5 text-[#ec4699] transition-all hover:bg-[#ec4699] hover:text-white">
                    {iconFor(item.icon)}
                  </div>
                  <span className="font-medium">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="bg-slate-900/3 px-6 py-24 lg:px-20">
          <div className="mx-auto max-w-3xl">
            <SectionHeading title="Dúvidas Frequentes" />
            <div className="space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-xl border border-[#ec4699]/5 bg-white p-6 shadow-sm"
                >
                  <summary className="flex cursor-pointer items-center justify-between font-bold text-slate-900">
                    {item.question}
                    <span className="text-[#ec4699]">+</span>
                  </summary>
                  <p className="mt-4 text-slate-600">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 px-6 py-16 text-white lg:px-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
              <div className="flex flex-col gap-6 lg:w-1/3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ec4699] text-white">
                    <WandSparkles className="h-5 w-5" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">Beautly</span>
                </div>
                <p className="text-slate-400">
                  Transformando a gestão de beleza e estética com tecnologia elegante e
                  eficiente.
                </p>
                <div className="flex gap-4">
                  {[<Globe key="world" className="h-4 w-4" />, <Share2 key="share" className="h-4 w-4" />].map(
                    (icon, index) => (
                      <a
                        key={index}
                        href="#"
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 transition-colors hover:bg-[#ec4699]"
                      >
                        {icon}
                      </a>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:w-1/2">
                {footerColumns.map((column) => (
                  <div key={column.title} className="flex flex-col gap-4">
                    <h6 className="font-bold">{column.title}</h6>
                    {column.links.map((link) => (
                      <a key={link} href="#" className="text-slate-400 hover:text-[#ec4699]">
                        {link}
                      </a>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-16 border-t border-slate-800 pt-8 text-center">
              <div className="mb-8 flex flex-col items-center gap-6 rounded-2xl bg-slate-800/50 p-8">
                <h3 className="text-2xl font-bold">Pronta para profissionalizar sua clínica?</h3>
                <PrimaryButton rounded="full">Começar Agora Gratuitamente</PrimaryButton>
              </div>
              <p className="text-sm text-slate-500">
                © 2024 Beautly SaaS. Todos os direitos reservados. Feito com amor para
                profissionais de beleza.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
