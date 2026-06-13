const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELED_BY_CLIENT: "Cancelado por você",
  CANCELED_BY_PROFESSIONAL: "Cancelado pela profissional",
  RESCHEDULED: "Remarcado",
};

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELED_BY_CLIENT: "bg-zinc-100 text-zinc-600",
  CANCELED_BY_PROFESSIONAL: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-lilac-100 text-lilac-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_CLASS[status] ?? "bg-brand-100 text-brand-700"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
