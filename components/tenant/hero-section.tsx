// components/tenant/hero-section.tsx

type Props = {
  name: string
  logoUrl: string | null
}

export function HeroSection({ name, logoUrl }: Props) {
  const safeLogo = logoUrl?.startsWith('https://') ? logoUrl : null

  return (
    <section className="relative min-h-[60vh] flex flex-col justify-end md:flex-row md:items-center overflow-hidden bg-[#0a0a0a]">
      {/* Background: image or gradient */}
      {safeLogo ? (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${safeLogo})` }}
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a0a14] to-[#ec4899]/30"
          aria-hidden="true"
        />
      )}

      {/* Overlay for text legibility */}
      <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 px-6 pb-12 pt-24 md:w-1/2 md:px-12 md:py-20">
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#ec4899]">
          Seu salão de beleza
        </p>
        <h1 className="mb-4 text-4xl font-bold text-white md:text-5xl">{name}</h1>
        <p className="mb-8 text-base text-white/70">
          Agende seu horário com facilidade
        </p>
        <button
          type="button"
          title="Em breve"
          className="rounded-xl bg-[#ec4899] px-8 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90"
        >
          Agendar agora
        </button>
      </div>
    </section>
  )
}
