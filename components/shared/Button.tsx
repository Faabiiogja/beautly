// Botão pílula do design system: primário (ação principal), secundário (ação alternativa, ex.: o
// gatilho "Cancelar" ou "Manter" num diálogo) e destrutivo (a confirmação em si, ex.: "Cancelar
// agendamento" dentro do diálogo — precisa ser a ação de maior destaque ali, por isso é sólido).
export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-primary',
  secondary: 'border-[1.5px] border-border-soft bg-card text-ink hover:bg-subtle',
  destructive: 'bg-danger text-on-brand hover:bg-[#b04030]',
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex h-[52px] items-center justify-center rounded-full px-6 text-label-lg shadow-soft transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
