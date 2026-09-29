'use client'

import { useFormStatus } from 'react-dom'

export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="h-[52px] w-full rounded-full bg-brand text-label-lg text-on-brand shadow-soft transition active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? 'Aguarde…' : children}
    </button>
  )
}
