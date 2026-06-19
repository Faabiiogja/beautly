import { requireProfessional } from "@/lib/auth-guard";
import { getWeeklyHours } from "@/services/business-service";
import { HoursForm } from "./hours-form";

export default async function HoursPage() {
  const session = await requireProfessional();
  const hours = await getWeeklyHours(session.businessId!);

  return (
    <main className="mx-auto max-w-xl">
      <h1 className="page-title">Horários de atendimento</h1>
      <p className="mt-1 text-sm text-ink-500">
        Marque os dias em que você atende e o horário de início e fim. Para
        folgas pontuais, feche o dia direto na agenda.
      </p>
      <HoursForm
        hours={hours.map((hour) => ({
          weekday: hour.weekday,
          isOpen: hour.isOpen,
          startTime: hour.startTime,
          endTime: hour.endTime,
        }))}
      />
    </main>
  );
}
