// app/super-admin/page.tsx
import { requireSuperAdmin } from '@/lib/super-admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { Toaster } from '@/components/ui/sonner'
import {
  ToggleStatusButton,
  DeleteTenantButton,
  CreateTenantButton,
} from './_components/tenant-actions'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  active:    { label: 'ativo',     color: '#22c55e', bg: '#14532d' },
  inactive:  { label: 'pausado',   color: '#f59e0b', bg: '#451a03' },
  suspended: { label: 'suspenso',  color: '#ef4444', bg: '#450a0a' },
}

export default async function SuperAdminPage() {
  await requireSuperAdmin()

  const supabase = createSupabaseServiceClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, slug, name, monthly_price, status, created_at')
    .order('created_at', { ascending: false })

  const allTenants = tenants ?? []
  const active = allTenants.filter((t) => t.status === 'active')
  const inactive = allTenants.filter((t) => t.status === 'inactive')
  const mrr = active.reduce((sum, t) => sum + Number(t.monthly_price), 0)
  const lastInactive = inactive[0]

  const adminEmail = process.env.SUPER_ADMIN_EMAIL ?? 'admin'
  const defaultPrice = parseFloat(process.env.MONTHLY_PRICE_DEFAULT ?? '99.90')

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', color: '#f1f5f9', minHeight: '100vh', background: '#0f172a' }}>
      <Toaster theme="dark" />

      {/* Topbar */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ec4899' }} />
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.05em' }}>BEAUTLY ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ color: '#64748b', fontSize: '12px' }}>{adminEmail}</span>
          <form action="/api/super-admin/logout" method="POST">
            <button type="submit" style={{ color: '#ef4444', background: 'transparent', border: 'none', fontSize: '12px', cursor: 'pointer' }}>
              sair
            </button>
          </form>
        </div>
      </div>

      <div style={{ padding: '24px' }}>

        {/* Metric cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>MRR</div>
            <div style={{ color: '#ec4899', fontSize: '24px', fontWeight: 700 }}>
              R$ {mrr.toFixed(2).replace('.', ',')}
            </div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>TENANTS ATIVOS</div>
            <div style={{ color: '#f1f5f9', fontSize: '24px', fontWeight: 700 }}>{active.length}</div>
            <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>de {allTenants.length} cadastrados</div>
          </div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '16px' }}>
            <div style={{ color: '#64748b', fontSize: '10px', letterSpacing: '0.08em', marginBottom: '4px' }}>PAUSADOS</div>
            <div style={{ color: '#f59e0b', fontSize: '24px', fontWeight: 700 }}>{inactive.length}</div>
            {lastInactive && (
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{lastInactive.name}</div>
            )}
          </div>
        </div>

        {/* Tenant table */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 600, letterSpacing: '0.05em' }}>TENANTS</span>
          <CreateTenantButton defaultMonthlyPrice={defaultPrice} />
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 120px', gap: '8px', padding: '10px 16px', borderBottom: '1px solid #334155' }}>
            {['NOME', 'SLUG', 'MENSALIDADE', 'STATUS', 'AÇÕES'].map((h) => (
              <span key={h} style={{ color: '#475569', fontSize: '10px', letterSpacing: '0.06em' }}>{h}</span>
            ))}
          </div>

          {allTenants.length === 0 && (
            <div style={{ padding: '24px 16px', color: '#475569', fontSize: '13px', textAlign: 'center' }}>
              Nenhum tenant cadastrado.
            </div>
          )}
          {allTenants.map((tenant, i) => {
            const badge = STATUS_BADGE[tenant.status] ?? STATUS_BADGE.suspended
            const isLast = i === allTenants.length - 1
            return (
              <div
                key={tenant.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 120px',
                  gap: '8px',
                  padding: '10px 16px',
                  borderBottom: isLast ? 'none' : '1px solid #0f172a',
                  alignItems: 'center',
                  opacity: tenant.status === 'inactive' ? 0.75 : 1,
                }}
              >
                <span style={{ fontSize: '13px' }}>{tenant.name}</span>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#64748b' }}>{tenant.slug}</span>
                <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                  R$ {Number(tenant.monthly_price).toFixed(2).replace('.', ',')}
                </span>
                <span style={{
                  display: 'inline-flex',
                  background: badge.bg,
                  color: badge.color,
                  fontSize: '10px',
                  fontWeight: 600,
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  width: 'fit-content',
                }}>
                  {badge.label}
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <ToggleStatusButton id={tenant.id} currentStatus={tenant.status} />
                  <DeleteTenantButton id={tenant.id} name={tenant.name} />
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </div>
  )
}
