type Tone = "success" | "danger" | "muted" | "brand" | "lilac";

const STATUS_META: Record<string, { label: string; tone: Tone }> = {
  CONFIRMED: { label: "Confirmado", tone: "success" },
  CANCELED_BY_CLIENT: { label: "Cancelado por você", tone: "muted" },
  CANCELED_BY_PROFESSIONAL: { label: "Cancelado pela profissional", tone: "danger" },
  RESCHEDULED: { label: "Remarcado", tone: "lilac" },
};

const ACTIVE_META: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "Ativa", tone: "success" },
  INACTIVE: { label: "Inativa", tone: "muted" },
};

const TONE_CLASS: Record<Tone, string> = {
  success: "badge-success",
  danger: "badge-danger",
  muted: "badge-muted",
  brand: "badge-brand",
  lilac: "badge-lilac",
};

/** Badge de status de agendamento (cliente/profissional). */
export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${meta ? TONE_CLASS[meta.tone] : "badge-brand"}`}>
      {meta?.label ?? status}
    </span>
  );
}

/** Badge de "Ativa/Inativa" para profissionais (área platform). */
export function ActiveBadge({ status }: { status: string }) {
  const meta = ACTIVE_META[status];
  return (
    <span className={`badge ${meta ? TONE_CLASS[meta.tone] : "badge-brand"}`}>
      {meta?.label ?? status}
    </span>
  );
}

/** Badge de "Ativo/Inativo" para serviços (área admin). */
export function ServiceActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <span className="badge badge-success">Ativo</span>
  ) : (
    <span className="badge badge-muted">Inativo</span>
  );
}
