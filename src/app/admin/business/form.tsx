"use client";

import Image from "next/image";
import { useActionState } from "react";
import {
  saveBusinessAction,
  type BusinessActionState,
} from "./actions";

interface Props {
  defaults: {
    name: string;
    contactPhone: string;
    defaultMessage: string;
    slotIntervalMinutes: number;
    logoUrl: string | null;
  };
}

export function BusinessForm({ defaults }: Props) {
  const [state, action, pending] = useActionState<
    BusinessActionState | null,
    FormData
  >(saveBusinessAction, null);
  return (
    <div className="mt-6 space-y-6">
      <form action={action} className="card space-y-4 p-5">
        <div>
          <label htmlFor="biz-name" className="field-label">
            Nome do negócio
          </label>
          <input
            id="biz-name"
            name="name"
            defaultValue={defaults.name}
            placeholder="Maria Nails"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="biz-phone" className="field-label">
            Telefone (WhatsApp)
          </label>
          <input
            id="biz-phone"
            name="contactPhone"
            type="tel"
            defaultValue={defaults.contactPhone}
            placeholder="(11) 99999-8888"
            required
            className="input"
          />
        </div>
        <div>
          <label htmlFor="biz-message" className="field-label">
            Mensagem padrão para clientes
          </label>
          <textarea
            id="biz-message"
            name="defaultMessage"
            defaultValue={defaults.defaultMessage}
            placeholder="Ex: Chegue com 10 minutos de antecedência. O pagamento é feito no local."
            rows={3}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="biz-interval" className="field-label">
            Intervalo entre horários (minutos)
          </label>
          <input
            id="biz-interval"
            name="slotIntervalMinutes"
            type="number"
            defaultValue={defaults.slotIntervalMinutes}
            min={5}
            max={240}
            step={5}
            className="input"
          />
          <p className="mt-1 text-xs text-ink-500">
            Define de quanto em quanto tempo os horários são oferecidos (ex:
            30 = 09:00, 09:30, 10:00...).
          </p>
        </div>
        {state?.error && <p className="alert-error">{state.error}</p>}
        {state?.ok && <p className="alert-success">Dados salvos.</p>}
        <button disabled={pending} className="btn-primary w-full">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <form
        action="/api/logo"
        method="post"
        encType="multipart/form-data"
        className="card space-y-4 p-5"
      >
        <h2 className="section-label">Logotipo</h2>
        <div className="flex items-center gap-4">
          {defaults.logoUrl ? (
            <Image
              src={defaults.logoUrl}
              alt="Logotipo atual"
              width={80}
              height={80}
              className="h-20 w-20 rounded-full border border-cream-200 object-cover"
            />
          ) : (
            <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 font-display text-2xl font-semibold text-brand-700">
              {defaults.name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="flex-1">
            <label htmlFor="logo" className="field-label">
              Imagem (PNG, JPG ou WebP, até 2MB)
            </label>
            <input
              id="logo"
              name="logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
              className="block w-full text-sm text-ink-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
        </div>
        <button className="btn-secondary">Enviar logotipo</button>
      </form>
    </div>
  );
}
