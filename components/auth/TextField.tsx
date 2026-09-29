'use client'

import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/public/icons'

export function TextField({
  label,
  name,
  type = 'text',
  error,
  defaultValue,
  autoComplete,
  inputMode,
  placeholder,
  hint,
}: {
  label: string
  name: string
  type?: string
  error?: string
  defaultValue?: string
  autoComplete?: string
  inputMode?: 'text' | 'numeric' | 'decimal' | 'tel'
  placeholder?: string
  hint?: string
}) {
  const [visible, setVisible] = useState(false)
  const isPassword = type === 'password'
  const errorId = `${name}-error`
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-label-md text-ink">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && visible ? 'text' : type}
          defaultValue={defaultValue}
          autoComplete={autoComplete}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={`h-[52px] w-full rounded-card border-[1.5px] bg-card px-4 text-base text-ink outline-none transition focus:border-brand focus:ring-[3px] focus:ring-brand/15 ${
            isPassword ? 'pr-12' : ''
          } ${error ? 'border-danger' : 'border-border-soft'}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-muted transition hover:text-ink"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
      </div>
      {hint && !error && <p className="text-sm text-muted">{hint}</p>}
      {error && (
        <p id={errorId} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
