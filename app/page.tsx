// app/page.tsx
// Página temporária para smoke test do multi-tenant.
// Será substituída pelo roteamento de booking na feature/booking-flow.
export const dynamic = 'force-dynamic' // usa headers() — nunca estático

import { getCurrentTenant } from '@/lib/tenant'

export default async function RootPage() {
  const tenant = await getCurrentTenant()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold">Beautly — Foundation Check</h1>

        {tenant ? (
          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Tenant resolvido:</p>
            <p className="font-mono text-sm">{JSON.stringify(tenant, null, 2)}</p>
          </div>
        ) : (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              Nenhum tenant encontrado. Verifique que o Supabase local está rodando
              e que o DEV_TENANT_SLUG no .env.local aponta para um tenant existente.
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
