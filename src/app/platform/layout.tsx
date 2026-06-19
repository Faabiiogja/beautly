import { AdminShell } from "@/components/admin-shell";
import { getSession } from "@/lib/session";

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const authed = Boolean(session.userId) && session.role === "PLATFORM_ADMIN";

  if (!authed) return <>{children}</>;

  return (
    <AdminShell context="Plataforma" logoutAction="/platform/logout">
      {children}
    </AdminShell>
  );
}
