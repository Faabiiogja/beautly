'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/shared/Button'

export function PendingButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full sm:w-auto">
      {pending ? pendingText : children}
    </Button>
  )
}
