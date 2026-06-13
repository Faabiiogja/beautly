"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState } from "react";
import {
  confirmAction,
  sendCodeAction,
  type ConfirmState,
  type SendCodeState,
} from "./actions";

interface Props {
  slug: string;
  serviceId: string;
  selectedDate: string;
  slots: { iso: string; label: string }[];
}

export function BookingForm({ slug, serviceId, selectedDate, slots }: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [sendState, sendAction, sending] = useActionState<SendCodeState | null, FormData>(
    sendCodeAction,
    null,
  );
  const [confirmState, confirmFormAction, confirming] = useActionState<
    ConfirmState | null,
    FormData
  >(confirmAction, null);

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm">Data</label>
        <input
          type="date"
          defaultValue={selectedDate}
          onChange={(event) =>
            router.push(`/${slug}/agendar?serviceId=${serviceId}&date=${event.target.value}`)
          }
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <p className="mb-2 text-sm">Horarios</p>
        {slots.length === 0 ? (
          <p className="rounded bg-gray-100 p-3 text-sm">
            Nao ha horarios disponiveis para este servico no momento.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.iso}
                type="button"
                onClick={() => setChosen(slot.iso)}
                className={`rounded border px-3 py-1 text-sm ${
                  chosen === slot.iso ? "bg-black text-white" : ""
                }`}
              >
                {slot.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {chosen && (
        <form action={confirmFormAction} className="space-y-3 border-t pt-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="startAt" value={chosen} />
          <input name="customerName" placeholder="Seu nome" required className="w-full rounded border p-2" />
          <input
            name="phone"
            placeholder="Seu telefone"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            className="w-full rounded border p-2"
          />

          <button
            type="button"
            disabled={sending}
            onClick={() => {
              const form = new FormData();
              form.set("slug", slug);
              form.set("phone", phone);
              sendAction(form);
            }}
            className="w-full rounded border p-2 text-sm disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar codigo de confirmacao"}
          </button>
          {sendState?.error && <p className="text-sm text-red-600">{sendState.error}</p>}
          {sendState?.sent && (
            <p className="text-sm text-green-600">Codigo enviado. Verifique seu telefone.</p>
          )}

          <input name="code" placeholder="Codigo recebido" className="w-full rounded border p-2" />
          {confirmState?.error && <p className="text-sm text-red-600">{confirmState.error}</p>}
          <button type="submit" disabled={confirming} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
            {confirming ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </form>
      )}
    </div>
  );
}
