import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness } from "@/services/business-service";
import { BusinessForm } from "./form";

export default async function BusinessPage() {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Dados do negocio</h1>
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
