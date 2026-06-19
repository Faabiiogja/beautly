import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness } from "@/services/business-service";
import { BusinessForm } from "./form";

export default async function BusinessPage() {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  return (
    <main className="mx-auto max-w-md">
      <h1 className="page-title">Dados do negócio</h1>
      <p className="mt-1 text-sm text-ink-500">
        Essas informações aparecem na sua página pública de agendamento.
      </p>
      <BusinessForm
        defaults={{
          name: business.name,
          contactPhone: business.contactPhone,
          defaultMessage: business.defaultMessage ?? "",
          slotIntervalMinutes: business.slotIntervalMinutes,
          logoUrl: business.logoUrl,
        }}
      />
    </main>
  );
}
