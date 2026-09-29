import 'server-only'
import { sendEmail } from '@/lib/email'
import { buildAppointmentEmail, type AppointmentEmailKind } from '@/lib/notifications'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

const PANEL_URL =
  process.env.NEXT_PUBLIC_PANEL_URL ?? `https://painel.${process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'beautly.cloud'}`

// Avisa a profissional por e-mail que uma cliente agendou ou cancelou. O destinatário é o e-mail de login do
// tenant (tenants.id = auth.users.id), nunca algo vindo da requisição. Roda depois da resposta e NUNCA lança:
// uma falha aqui não pode desfazer nem atrasar o agendamento/cancelamento.
export async function notifyProfessional(kind: AppointmentEmailKind, input: { tenantId: string; token: string }): Promise<void> {
  try {
    const supabase = createServiceRoleClient()
    const [{ data: appointment }, { data: tenant }, { data: owner }] = await Promise.all([
      supabase
        .from('appointments')
        .select('client_name, client_phone, service_name_snapshot, price_cents_snapshot, start_time')
        .eq('tenant_id', input.tenantId)
        .eq('token', input.token)
        .maybeSingle(),
      supabase.from('tenants').select('business_name').eq('id', input.tenantId).maybeSingle(),
      supabase.auth.admin.getUserById(input.tenantId),
    ])
    const to = owner?.user?.email
    if (!appointment || !tenant || !to) {
      console.error('notify: dados insuficientes para avisar a profissional', { kind, hasAppointment: !!appointment, hasTenant: !!tenant, hasEmail: !!to })
      return
    }

    const mail = buildAppointmentEmail(kind, {
      clientName: appointment.client_name,
      clientPhone: appointment.client_phone,
      serviceName: appointment.service_name_snapshot,
      priceCents: appointment.price_cents_snapshot,
      startTime: appointment.start_time,
      businessName: tenant.business_name,
      panelUrl: `${PANEL_URL}/agendamentos`,
    })
    await sendEmail({ to, ...mail, idempotencyKey: `appointment-${kind}-${input.token}` })
  } catch (error) {
    console.error('notify: falha ao avisar a profissional', error)
  }
}
