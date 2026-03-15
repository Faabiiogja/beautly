import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { HoursForm } from './_components/hours-form'
import { BlockDialog } from './_components/block-dialog'
import { deleteScheduleBlock } from './actions'

export const dynamic = 'force-dynamic'

export default async function SchedulePage() {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const [{ data: hours }, { data: blocks }] = await Promise.all([
    supabase
      .from('business_hours')
      .select('day_of_week, open_time, close_time, is_open')
      .eq('tenant_id', session.tenantId)
      .order('day_of_week'),
    supabase
      .from('schedule_blocks')
      .select('id, start_at, end_at, reason')
      .eq('tenant_id', session.tenantId)
      .order('start_at'),
  ])

  return (
    <div className="p-6 max-w-3xl space-y-10">
      {/* Business hours */}
      <section>
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-stone-900 mb-5">
          Horários de funcionamento
        </h1>
        <HoursForm hours={hours ?? []} />
      </section>

      {/* Schedule blocks */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-stone-900">Bloqueios</h2>
          <BlockDialog
            trigger={
              <button className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition-colors">
                Novo bloqueio
              </button>
            }
          />
        </div>

        {!blocks?.length ? (
          <p className="text-sm text-stone-500">Nenhum bloqueio cadastrado.</p>
        ) : (
          <ul className="space-y-3">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4"
              >
                <div>
                  <p className="text-sm font-medium text-stone-900">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(block.start_at))}
                    {' – '}
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(block.end_at))}
                  </p>
                  {block.reason && (
                    <p className="text-xs text-stone-500 mt-0.5">{block.reason}</p>
                  )}
                </div>
                <DeleteBlockForm id={block.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function DeleteBlockForm({ id }: { id: string }) {
  async function handleDelete() {
    'use server'
    await deleteScheduleBlock(id)
  }

  return (
    <form action={handleDelete}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-600">
        Excluir
      </button>
    </form>
  )
}
