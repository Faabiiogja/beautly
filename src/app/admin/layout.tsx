import { getSession } from "@/lib/session";
import { getBusiness } from "@/services/business-service";
import Link from "next/link";
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
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-3xl px-6 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="font-display text-lg font-semibold text-brand-700">
                Beautly
              </span>
              <span className="mx-2 text-zinc-300">·</span>
              <span className="truncate text-sm text-zinc-600">
                {business.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/${business.slug}`}
                target="_blank"
                className="text-sm text-brand-700 hover:underline"
              >
                Ver minha página ↗
              </Link>
              <form action="/admin/logout" method="post">
                <button className="text-sm text-zinc-500 hover:text-zinc-900">
                  Sair
                </button>
              </form>
            </div>
          </div>
          <div className="mt-3 pb-2">
            <AdminNav />
          </div>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
