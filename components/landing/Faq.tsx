'use client'

import { useState } from 'react'

const ITEMS: { question: string; answer: string }[] = [
  {
    question: 'Minha cliente precisa instalar algum aplicativo ou criar conta?',
    answer:
      'Não. Ela abre o seu link no navegador do celular (funciona dentro do Instagram e do WhatsApp também) e agenda em poucos toques, sem instalar nada e sem senha.',
  },
  {
    question: 'Como eu recebo o pagamento da cliente?',
    answer:
      'O Beautly não processa pagamento — você continua recebendo do seu jeito, como já faz hoje (Pix, cartão ou dinheiro no atendimento).',
  },
  {
    question: 'Minha cliente pode cancelar um agendamento sozinha?',
    answer: 'Sim, pelo mesmo link do agendamento, a qualquer momento antes do horário. O seu painel mostra o cancelamento na hora.',
  },
  {
    question: 'Dá pra ter mais de uma profissional numa conta?',
    answer: 'Por enquanto não — cada conta do Beautly é de uma profissional só, com sua própria agenda e link.',
  },
  {
    question: 'Como eu começo a usar?',
    answer: 'Hoje o Beautly funciona por convite: fale com a gente pelo botão acima e configuramos sua agenda juntas.',
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <dl className="mx-auto flex w-full max-w-[640px] flex-col gap-3">
      {ITEMS.map((item, index) => {
        const expanded = open === index
        return (
          <div key={item.question} className="overflow-hidden rounded-card border border-border-soft bg-card shadow-soft">
            <dt>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(expanded ? null : index)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              >
                <span className="font-headline text-headline-sm text-ink">{item.question}</span>
                <span aria-hidden className={`shrink-0 text-muted transition-transform ${expanded ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
            </dt>
            {expanded && (
              <dd className="px-5 pb-4 text-sm leading-relaxed text-muted">{item.answer}</dd>
            )}
          </div>
        )
      })}
    </dl>
  )
}
