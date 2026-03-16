import {
  ArrowRight,
  Calendar,
  Clock,
  Instagram,
  LayoutDashboard,
  Link,
  ListChecks,
  MessageCircle,
  Play,
  Settings,
  Share2,
  UserPlus,
  Zap,
} from 'lucide-react'
import {
  ctaContent,
  featureCards,
  featuresContent,
  footerColumns,
  footerContent,
  heroContent,
  interfaceContent,
  navLinks,
  painPointsContent,
  problemCards,
  steps,
  stepsContent,
  testimonials,
  testimonialsContent,
} from '@/app/_components/marketing/landing-data'

function LogoIcon() {
  return (
    <div
      className="flex h-9 w-9 items-center justify-center rounded-xl"
      style={{ background: 'linear-gradient(135deg, #7d549e 0%, #a77bc8 100%)' }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2L14.5 9.5H22L16 13.5L18.5 21L12 17L5.5 21L8 13.5L2 9.5H9.5L12 2Z"
          fill="white"
        />
      </svg>
    </div>
  )
}

function CheckBadge({ white = false }: { white?: boolean }) {
  if (white) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <circle cx="10" cy="10" r="10" fill="white" fillOpacity="0.2" />
        <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="#7d549e" fillOpacity="0.15" />
      <path d="M6 10l3 3 5-5" stroke="#7d549e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#fee2e2" />
      <path d="M6 6l6 6M12 6l-6 6" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function SolutionCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#dcfce7" />
      <path d="M5 9l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ProblemIcon({ name }: { name: string }) {
  const cls = 'h-6 w-6 text-[#7d549e]'
  switch (name) {
    case 'calendar':
      return <Calendar className={cls} />
    case 'layout':
      return <LayoutDashboard className={cls} />
    case 'clock':
      return <Clock className={cls} />
    case 'zap':
      return <Zap className={cls} />
    default:
      return <Calendar className={cls} />
  }
}

function FeatureIcon({ name }: { name: string }) {
  const cls = 'h-6 w-6 text-[#7d549e]'
  switch (name) {
    case 'calendar':
      return <Calendar className={cls} />
    case 'message-circle':
      return <MessageCircle className={cls} />
    case 'link':
      return <Link className={cls} />
    case 'list-checks':
      return <ListChecks className={cls} />
    case 'clock':
      return <Clock className={cls} />
    case 'layout-dashboard':
      return <LayoutDashboard className={cls} />
    default:
      return <Calendar className={cls} />
  }
}

function StepIcon({ name }: { name: string }) {
  const cls = 'h-6 w-6 text-white'
  switch (name) {
    case 'user-plus':
      return <UserPlus className={cls} />
    case 'settings':
      return <Settings className={cls} />
    case 'share-2':
      return <Share2 className={cls} />
    default:
      return <UserPlus className={cls} />
  }
}

export function BeautlyLandingPage() {
  return (
    <main
      className="min-h-screen bg-[#fdfcfd] text-[#1f1f24]"
      style={{ fontFamily: 'var(--font-dm-sans), sans-serif' }}
    >
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-[#e8e8ea] bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1336px] items-center justify-between px-4 py-4 sm:px-6 lg:px-[67px]">
          <div className="flex items-center gap-2">
            <LogoIcon />
            <span className="text-lg font-semibold text-[#1f1f24]">Beautly</span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-[#1f1f24] transition-colors hover:text-[#7d549e]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="hidden text-sm font-medium text-[#1f1f24] transition-colors hover:text-[#7d549e] md:block"
            >
              Entrar
            </button>
            <button
              type="button"
              className="rounded-lg bg-[#7d549e] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4e3566]"
            >
              Começar grátis
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-[67px] lg:pt-24">
        <div className="mx-auto max-w-[1336px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              {/* Badge */}
              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fcf3f5] px-3 py-1.5">
                <span className="text-xs font-semibold text-[#4e3566]">{heroContent.badge}</span>
              </div>

              {/* Heading */}
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-[#1f1f24] lg:text-5xl xl:text-6xl">
                {heroContent.titleStart}
                <span className="text-[#7d549e]">{heroContent.titleHighlight}</span>
              </h1>

              <p className="text-base leading-relaxed text-[#868691] lg:text-lg">
                {heroContent.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg bg-[#7d549e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4e3566]"
                >
                  {heroContent.primaryCta}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className="flex items-center justify-center gap-2 rounded-lg border border-[#e8e8ea] bg-white px-6 py-3 text-sm font-semibold text-[#1f1f24] transition-colors hover:bg-[#faf8fb]"
                >
                  <Play className="h-4 w-4" />
                  {heroContent.secondaryCta}
                </button>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4">
                {heroContent.trustBadges.map((badge) => (
                  <div key={badge} className="flex items-center gap-1.5">
                    <CheckBadge />
                    <span className="text-sm text-[#868691]">{badge}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero image */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-3xl bg-[#7d549e]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-[#e8e8ea] bg-white shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]">
                <img
                  src={heroContent.heroImage}
                  alt="Interface do Beautly mostrando agenda online de estética"
                  className="w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="px-4 py-20 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#1f1f24] lg:text-4xl">
              {painPointsContent.title}
            </h2>
            <p className="mt-3 text-base text-[#868691]">{painPointsContent.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {problemCards.map((card) => (
              <article
                key={card.problem}
                className="rounded-2xl border border-[#e8e8ea] bg-white p-6 shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]"
              >
                {/* Icon */}
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#f4eff7]">
                  <ProblemIcon name={card.icon} />
                </div>

                {/* Problem */}
                <div className="mb-2 flex items-center gap-2">
                  <XIcon />
                  <span className="text-sm text-[#868691] line-through">{card.problem}</span>
                </div>

                {/* Solution */}
                <div className="flex items-center gap-2">
                  <SolutionCheck />
                  <span className="text-sm font-medium text-[#1f1f24]">{card.solution}</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Steps — "Comece em minutos" */}
      <section id="como-funciona" className="bg-[#faf8fb] px-4 py-20 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#1f1f24] lg:text-4xl">{stepsContent.title}</h2>
            <p className="mt-3 text-base text-[#868691]">{stepsContent.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex flex-col items-start">
                <article className="w-full rounded-2xl border border-[#e8e8ea] bg-white p-6 shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]">
                  {/* Icon with gradient + number badge */}
                  <div className="relative mb-5 inline-flex">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ background: 'linear-gradient(135deg, #7d549e 0%, #a77bc8 100%)' }}
                    >
                      <StepIcon name={step.icon} />
                    </div>
                    <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#7d549e] text-xs font-bold text-white">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-[#1f1f24]">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-[#868691]">{step.description}</p>
                </article>

                {/* Arrow between cards on desktop */}
                {index < steps.length - 1 && (
                  <div className="absolute -right-4 top-1/2 hidden -translate-y-1/2 lg:block">
                    <ArrowRight className="h-6 w-6 text-[#868691]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-[#654485]">{stepsContent.ctaBadge}</p>
            <button
              type="button"
              className="rounded-lg bg-[#7d549e] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4e3566]"
            >
              {stepsContent.ctaButton}
            </button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="funcionalidades" className="px-4 py-20 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center rounded-full bg-[#f4eff7] px-3 py-1.5">
              <span className="text-xs font-semibold text-[#654485]">{featuresContent.badge}</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1f1f24] lg:text-4xl">{featuresContent.title}</h2>
            <p className="mt-3 text-base text-[#868691]">{featuresContent.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((card) => (
              <article
                key={card.title}
                className="rounded-2xl border border-[#e8e8ea] bg-white p-6 shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]"
              >
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f4eff7]">
                  <FeatureIcon name={card.icon} />
                </div>
                <h3 className="mb-2 text-base font-semibold text-[#1f1f24]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-[#868691]">{card.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Interface */}
      <section className="px-4 py-20 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#1f1f24] lg:text-4xl">{interfaceContent.title}</h2>
            <p className="mt-3 text-base text-[#868691]">{interfaceContent.subtitle}</p>
          </div>

          <div className="relative">
            {/* Purple glow blur */}
            <div className="absolute inset-0 rounded-3xl bg-[#7d549e]/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-[#e8e8ea] bg-white shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]">
              <img
                src={interfaceContent.image}
                alt="Interface moderna e intuitiva do painel do Beautly"
                className="w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="bg-[#faf8fb] px-4 py-20 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#1f1f24] lg:text-4xl">
              {testimonialsContent.title}
            </h2>
            <p className="mt-3 text-base text-[#868691]">{testimonialsContent.subtitle}</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <article
                key={item.name}
                className="rounded-2xl border border-[#e8e8ea] bg-white p-6 shadow-[0px_4px_8px_0px_rgba(99,98,105,0.12)]"
              >
                {/* Stars */}
                <div className="mb-4 flex gap-1">
                  {Array.from({ length: item.stars }).map((_, i) => (
                    <svg
                      key={`${item.name}-star-${i}`}
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="#f59e0b"
                      aria-hidden="true"
                    >
                      <path d="M8 1l1.9 4 4.4.6-3.2 3 .8 4.4L8 11l-3.9 2 .8-4.4L1.7 5.6l4.4-.6L8 1z" />
                    </svg>
                  ))}
                </div>

                <p className="mb-6 text-sm italic leading-relaxed text-[#868691]">
                  &quot;{item.quote}&quot;
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #7d549e 0%, #a77bc8 100%)' }}
                  >
                    {item.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1f1f24]">{item.name}</p>
                    <p className="text-xs text-[#868691]">{item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section
        className="relative overflow-hidden px-4 py-20 sm:px-6 lg:px-[67px]"
        style={{ background: 'linear-gradient(160deg, #7d549e 0%, #a77bc8 100%)' }}
      >
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-1/4 top-8 h-32 w-32 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-[1336px] text-center">
          <h2 className="text-4xl font-bold text-white lg:text-5xl">{ctaContent.title}</h2>
          <p className="mt-4 text-base text-white/80">{ctaContent.subtitle}</p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#4e3566] transition-colors hover:bg-white/90"
            >
              {ctaContent.primaryCta}
            </button>
            <button
              type="button"
              className="rounded-lg border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {ctaContent.secondaryCta}
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
            {ctaContent.trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-1.5">
                <CheckBadge white />
                <span className="text-sm text-white/80">{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e8e8ea] bg-[#fdfcfd] px-4 py-16 sm:px-6 lg:px-[67px]">
        <div className="mx-auto max-w-[1336px]">
          <div className="flex flex-col gap-12 lg:flex-row lg:justify-between">
            {/* Brand */}
            <div className="flex flex-col gap-5 lg:max-w-xs">
              <div className="flex items-center gap-2">
                <LogoIcon />
                <span className="text-lg font-semibold text-[#1f1f24]">Beautly</span>
              </div>
              <p className="text-sm leading-relaxed text-[#868691]">{footerContent.description}</p>

              {/* Social icons */}
              <div className="flex gap-3">
                <a
                  href="#"
                  aria-label="Instagram"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f6] text-[#868691] transition-colors hover:text-[#7d549e]"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="TikTok"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f6] text-[#868691] transition-colors hover:text-[#7d549e]"
                >
                  {/* TikTok SVG inline */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.84 1.56V6.78a4.85 4.85 0 01-1.07-.09z" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f5f6] text-[#868691] transition-colors hover:text-[#7d549e]"
                >
                  {/* WhatsApp SVG inline */}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Columns */}
            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              {footerColumns.map((column) => (
                <div key={column.title} className="flex flex-col gap-4">
                  <h6 className="text-sm font-semibold text-[#1f1f24]">{column.title}</h6>
                  {column.links.map((link) => (
                    <a
                      key={link}
                      href="#"
                      className="text-sm text-[#868691] transition-colors hover:text-[#7d549e]"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Divider + copyright */}
          <div className="mt-12 border-t border-[#e8e8ea] pt-8">
            <p className="text-center text-sm text-[#868691]">{footerContent.copyright}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
