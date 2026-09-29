'use client'

import { useFormStatus } from 'react-dom'
import { Button, type ButtonVariant } from '@/components/shared/Button'

export function SubmitButton({ children, variant }: { children: React.ReactNode; variant?: ButtonVariant }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} variant={variant} className="w-full">
      {pending ? 'Aguarde…' : children}
    </Button>
  )
}
