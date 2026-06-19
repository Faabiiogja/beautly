import { AdminShell } from "@/components/admin-shell";
import { getSession } from "@/lib/session";
import { getBusiness } from "@/services/business-service";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const authed =
    Boolean(session.userId) &&
    session.role === "PROFESSIONAL" &&
    Boolean(session.businessId);

  if (!authed) return <>{children}</>;

  const business = await getBusiness(session.businessId!);

  return (
    <AdminShell
      context={business.name}
      logoutAction="/admin/logout"
      viewPageHref={`/${business.slug}`}
      nav={<AdminNav />}
    >
      {children}
    </AdminShell>
  );
}
