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
    <div className="flex flex-1 flex-col">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
          <div>
            <span className="font-display text-lg font-semibold text-brand-700">
              Beautly
            </span>
            <span className="mx-2 text-zinc-300">·</span>
            <span className="text-sm text-zinc-600">Plataforma</span>
          </div>
          <form action="/platform/logout" method="post">
            <button className="text-sm text-zinc-500 hover:text-zinc-900">
              Sair
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">{children}</div>
    </div>
  );
}
