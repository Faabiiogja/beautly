// Botão pílula do design system: primário (ação principal), secundário (ação alternativa) e
// destrutivo (cancelar/excluir). Usado direto ou envolvido por SubmitButton em formulários.
export type ButtonVariant = 'primary' | 'secondary' | 'destructive'

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-on-brand hover:bg-primary',
  secondary: 'border-[1.5px] border-border-soft bg-card text-ink hover:bg-subtle',
  destructive: 'border-[1.5px] border-danger bg-card text-danger hover:bg-danger-tint',
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
