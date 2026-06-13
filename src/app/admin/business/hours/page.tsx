import { requireProfessional } from "@/lib/auth-guard";
import { getWeeklyHours } from "@/services/business-service";
import { saveHoursAction } from "./actions";

const NAMES = [
  "Domingo",
  "Segunda",
  "Terca",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sabado",
];

export default async function HoursPage() {
  const session = await requireProfessional();
  const hours = await getWeeklyHours(session.businessId!);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Horarios de atendimento</h1>
      <form action={saveHoursAction} className="space-y-3">
        {hours.map((hour) => (
          <div key={hour.weekday} className="flex items-center gap-3">
            <label className="flex w-32 items-center gap-2">
              <input
                type="checkbox"
                name={`open-${hour.weekday}`}
                defaultChecked={hour.isOpen}
              />
              {NAMES[hour.weekday]}
            </label>
            <input
              type="time"
              name={`start-${hour.weekday}`}
              defaultValue={hour.startTime}
              className="rounded border p-1"
            />
            <span>ate</span>
            <input
              type="time"
              name={`end-${hour.weekday}`}
              defaultValue={hour.endTime}
              className="rounded border p-1"
            />
          </div>
        ))}
        <button className="rounded bg-black px-4 py-2 text-white">Salvar</button>
      </form>
    </main>
  );
}
