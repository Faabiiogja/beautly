"use client";

import { useId } from "react";

interface Props {
  /** Ícone à esquerda do campo (SVG inline). Recebe a cor atual via
   * `currentColor`. */
  icon?: React.ReactNode;
  /** Placeholder e valor controlado. */
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  name?: string;
  required?: boolean;
}

/**
 * Campo de telefone com prefixo de ícone, alinhado ao design system.
 * Substitui o wrapper duplicado em booking-form e access-form.
 */
export function PhoneField({
  icon,
  placeholder,
  value,
  onChange,
  id,
  name = "phone",
  required,
}: Props) {
  const generatedId = useId();
  const fieldId = id ?? `phone-${generatedId}`;
  return (
    <div className="phone-field">
      {icon ?? <DefaultPhoneIcon />}
      <input
        id={fieldId}
        name={name}
        type="tel"
        inputMode="tel"
        placeholder={placeholder ?? "(11) 90000-0000"}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function DefaultPhoneIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="text-ink-500"
      aria-hidden
    >
      <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
    </svg>
  );
}
