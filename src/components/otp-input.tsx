"use client";

import { useRef, useState } from "react";

interface Props {
  /** Nome do input oculto enviado no form (mantém `code`). */
  name?: string;
  length?: number;
  /** Pinta as casas em vermelho (código incorreto/expirado). */
  invalid?: boolean;
}

export function OtpInput({ name = "code", length = 6, invalid = false }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const value = digits.join("");

  function setAt(index: number, char: string) {
    setDigits((current) => {
      const next = [...current];
      next[index] = char;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    setAt(index, char);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1)
      refs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  const cellBase =
    "flex-1 aspect-square rounded-2xl text-center font-display text-[22px] font-semibold focus:outline-none";
  const cellTone = invalid
    ? "border-[1.5px] border-danger-200 bg-danger-50 text-danger-700"
    : "border-[1.5px] border-brand-200 bg-cream-50 text-ink-900 focus:border-2 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-100";

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex justify-between gap-2" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Dígito ${index + 1} do código`}
            aria-invalid={invalid}
            className={`${cellBase} ${cellTone}`}
          />
        ))}
      </div>
    </div>
  );
}
