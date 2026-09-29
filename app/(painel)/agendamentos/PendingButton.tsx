'use client'

import { useFormStatus } from 'react-dom'

export function PendingButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-11 rounded-full border-[1.5px] border-danger bg-card px-4 text-label-md text-danger disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  )
}
