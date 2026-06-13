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
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <input name="name" defaultValue={defaults.name} placeholder="Nome do negocio" required className="w-full rounded border p-2" />
        <input name="contactPhone" defaultValue={defaults.contactPhone} placeholder="Telefone" required className="w-full rounded border p-2" />
        <textarea name="defaultMessage" defaultValue={defaults.defaultMessage} placeholder="Mensagem padrao" className="w-full rounded border p-2" />
        <input name="slotIntervalMinutes" type="number" defaultValue={defaults.slotIntervalMinutes} min={5} max={240} className="w-full rounded border p-2" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-600">Salvo.</p>}
        <button disabled={pending} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <form action="/api/logo" method="post" encType="multipart/form-data" className="space-y-3">
        {defaults.logoUrl && (
          <Image
            src={defaults.logoUrl}
            alt="logo"
            width={80}
            height={80}
            className="h-20 w-20 rounded object-cover"
          />
        )}
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required />
        <button className="rounded border px-4 py-2">Enviar logo</button>
      </form>
    </div>
  );
}
