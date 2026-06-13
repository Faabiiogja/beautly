"use client";

import { useActionState } from "react";
import {
  requestAccessAction,
  verifyAccessAction,
  type AccessState,
} from "./actions";

export function AccessForm({ slug }: { slug: string }) {
  const [reqState, reqAction, requesting] = useActionState<
    AccessState | null,
    FormData
  >(requestAccessAction, null);
  const [verState, verAction, verifying] = useActionState<
    AccessState | null,
    FormData
  >(verifyAccessAction, null);

  return (
    <div className="space-y-4">
      <form action={reqAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <input name="phone" placeholder="Seu telefone" required className="w-full rounded border p-2" />
        <button disabled={requesting} className="w-full rounded border p-2 text-sm disabled:opacity-50">
          {requesting ? "Enviando..." : "Receber codigo"}
        </button>
        {reqState?.error && <p className="text-sm text-red-600">{reqState.error}</p>}
        {reqState?.sent && <p className="text-sm text-green-600">Codigo enviado.</p>}
      </form>

      <form action={verAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <input name="phone" placeholder="Confirme o telefone" required className="w-full rounded border p-2" />
        <input name="code" placeholder="Codigo" required className="w-full rounded border p-2" />
        <button disabled={verifying} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {verifying ? "Verificando..." : "Acessar"}
        </button>
        {verState?.error && <p className="text-sm text-red-600">{verState.error}</p>}
        {verState?.ok && <p className="text-sm text-green-600">Telefone verificado.</p>}
      </form>
    </div>
  );
}
