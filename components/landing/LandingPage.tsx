import { Logo } from '@/components/shared/Logo'
import { VARIANT_CLASSES } from '@/components/shared/Button'
import { Card } from '@/components/shared/Card'
import { BrandEmblem } from '@/components/public/BrandEmblem'
import { CalendarIcon, CalendarOffIcon, ChatIcon, ClockIcon, CopyIcon, MailIcon, TuneIcon } from '@/components/public/icons'
import { Faq } from './Faq'

const PANEL_URL = process.env.NEXT_PUBLIC_PANEL_URL ?? `https://painel.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'}`
const CONTACT_HREF = `mailto:contato@beautly.cloud?subject=${encodeURIComponent('Quero conhecer o Beautly')}`

function ContactLink({ className = '' }: { className?: string }) {
  return (
    <a
      href={CONTACT_HREF}
      className={`inline-flex h-12 items-center justify-center rounded-full px-6 text-label-lg shadow-soft transition active:scale-[0.98] ${VARIANT_CLASSES.primary} ${className}`}
    >
      Falar com a gente
    </a>
  )
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <div className="mx-auto max-w-[560px] text-center">
      <p className="text-label-sm font-semibold tracking-wide text-brand uppercase">{eyebrow}</p>
      <h2 className="mt-2 font-headline text-headline-lg text-ink">{title}</h2>
      {subtitle && <p className="mt-3 text-body-md text-muted">{subtitle}</p>}
    </div>
  )
}

function Nav() {
  return (
    <header className="sticky top-0 z-30 border-b border-border-soft bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-[1100px] items-center justify-between px-5">
        <Logo size="sm" />
        <nav aria-label="Principal" className="hidden items-center gap-6 text-label-md text-muted md:flex">
          <a href="#como-funciona" className="transition hover:text-ink">
            Como funciona
          </a>
          <a href="#funcionalidades" className="transition hover:text-ink">
            Funcionalidades
          </a>
          <a href="#perguntas" className="transition hover:text-ink">
            Perguntas frequentes
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <a href={`${PANEL_URL}/login`} className="text-label-md text-ink transition hover:text-brand">
            Entrar
          </a>
          <ContactLink className="hidden sm:inline-flex" />
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="relative overflow-hidden px-5 pt-14 pb-16 sm:pt-20 sm:pb-24">
      <div aria-hidden className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-petal-soft/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-10 h-64 w-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="relative mx-auto flex max-w-[720px] flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-container-low p-3 shadow-soft">
          <BrandEmblem />
        </div>
        <h1 className="font-headline text-headline-lg text-ink sm:text-[40px] sm:leading-[1.15]">
          Menos ida e volta pelo WhatsApp,
          <br />
          <span className="text-brand italic">mais tempo atendendo.</span>
        </h1>
        <p className="mt-5 max-w-[520px] text-body-md text-muted">
          Sua cliente agenda sozinha, pelo celular, com um link só seu — sem baixar aplicativo, sem criar conta e sem trocar mensagem
          pra saber se tem horário.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <ContactLink />
          <a href="#como-funciona" className="text-label-md text-ink underline-offset-4 transition hover:text-brand hover:underline">
            Ver como funciona
          </a>
        </div>
      </div>
    </section>
  )
}

function Problem() {
  const items = [
    { icon: ChatIcon, title: 'Mensagem atrás de mensagem', text: 'Só pra saber se tem horário livre, e depois pra confirmar de novo.' },
    { icon: ClockIcon, title: 'Cliente esfria enquanto você atende', text: 'E quando você responde, ela já marcou em outro lugar.' },
    { icon: CalendarIcon, title: 'Caderno ou conversa perdida', text: 'Sem um lugar só pra ver a semana inteira organizada.' },
  ]
  return (
    <section className="px-5 py-16">
      <SectionHeading eyebrow="O problema" title="Você não abriu o estúdio para virar recepcionista de WhatsApp" />
      <div className="mx-auto mt-10 grid max-w-[900px] gap-4 sm:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <Card key={title} className="flex flex-col gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-danger-tint text-danger">
              <Icon />
            </div>
            <h3 className="font-headline text-headline-sm text-ink">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      icon: TuneIcon,
      title: 'Cadastre seus serviços e horários',
      text: 'Nome, preço, duração e os dias e horários em que você atende. Bloqueie um dia inteiro quando precisar.',
    },
    {
      icon: CopyIcon,
      title: 'Compartilhe seu link exclusivo',
      text: 'Um endereço só seu, do tipo seunome.beautly.cloud — cole na bio do Instagram ou mande direto no WhatsApp.',
    },
    {
      icon: CalendarIcon,
      title: 'Sua agenda se preenche sozinha',
      text: 'Você recebe um e-mail a cada novo agendamento ou cancelamento, e vê tudo organizado por dia no seu painel.',
    },
  ]
  return (
    <section id="como-funciona" className="scroll-mt-20 bg-container-low px-5 py-16">
      <SectionHeading eyebrow="Como funciona" title="Três passos, sem curso nem manual" />
      <div className="mx-auto mt-10 flex max-w-[900px] flex-col gap-6 sm:flex-row">
        {steps.map(({ icon: Icon, title, text }, index) => (
          <div key={title} className="flex flex-1 flex-col gap-3 rounded-panel bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-tint text-brand">
                <Icon />
              </div>
              <span className="font-headline text-headline-sm text-muted">0{index + 1}</span>
            </div>
            <h3 className="font-headline text-headline-sm text-ink">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function Features() {
  const items = [
    { icon: CopyIcon, title: 'Link só seu', text: 'Sua cliente agenda pelo seu link, sem instalar nada e sem criar conta.' },
    { icon: CalendarIcon, title: 'Sem choque de horário', text: 'Dois agendamentos nunca se sobrepõem — a confirmação é automática.' },
    { icon: ClockIcon, title: 'Painel cronológico', text: 'Sua semana organizada por dia, com cliente, serviço e valor de cada atendimento.' },
    { icon: CalendarOffIcon, title: 'Bloqueio de dias', text: 'Precisou faltar? Bloqueie o dia inteiro em segundos, sem mexer no que já está confirmado.' },
    { icon: MailIcon, title: 'Aviso por e-mail', text: 'Você recebe um e-mail a cada novo agendamento ou cancelamento.' },
    { icon: null, title: 'Sua cara', text: 'Logo, nome, telefone e endereço do seu jeito na sua página pública.' },
  ]
  return (
    <section id="funcionalidades" className="scroll-mt-20 px-5 py-16">
      <SectionHeading eyebrow="Funcionalidades" title="Só o que faz sua agenda andar" />
      <div className="mx-auto mt-10 grid max-w-[900px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex flex-col gap-3 rounded-card border border-border-soft bg-card p-5 shadow-soft">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-subtle p-2 text-primary">
              {Icon ? <Icon /> : <BrandEmblem />}
            </div>
            <h3 className="font-headline text-headline-sm text-ink">{title}</h3>
            <p className="text-sm text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function FaqSection() {
  return (
    <section id="perguntas" className="scroll-mt-20 bg-container-low px-5 py-16">
      <SectionHeading eyebrow="Tire suas dúvidas" title="Perguntas frequentes" />
      <div className="mt-10">
        <Faq />
      </div>
    </section>
  )
}

function FinalCta() {
  return (
    <section className="px-5 py-16">
      <Card className="mx-auto flex max-w-[720px] flex-col items-center gap-5 text-center">
        <h2 className="font-headline text-headline-lg text-ink">Pronta pra tirar sua agenda do WhatsApp?</h2>
        <p className="max-w-[440px] text-muted">
          Hoje o Beautly funciona por convite — fale com a gente e configuramos sua agenda juntas.
        </p>
        <ContactLink />
      </Card>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border-soft px-5 py-10">
      <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex flex-col items-center gap-1 sm:items-start">
          <Logo size="sm" />
          <p className="text-sm text-muted">Agendamento simples para profissionais da beleza.</p>
        </div>
        <nav aria-label="Rodapé" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-label-md text-muted">
          <a href="#como-funciona" className="transition hover:text-ink">
            Como funciona
          </a>
          <a href="#funcionalidades" className="transition hover:text-ink">
            Funcionalidades
          </a>
          <a href="#perguntas" className="transition hover:text-ink">
            Perguntas frequentes
          </a>
          <a href={`${PANEL_URL}/login`} className="transition hover:text-ink">
            Entrar
          </a>
        </nav>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-canvas">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Problem />
        <HowItWorks />
        <Features />
        <FaqSection />
        <FinalCta />
      </main>
      <Footer />
    </div>
  )
}
