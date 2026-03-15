import { requireAdmin } from '@/lib/admin/auth'
import { createSupabaseServiceClient } from '@/lib/supabase/server'
import { ProfessionalDialog } from './_components/professional-dialog'
import { toggleProfessional, deleteProfessional } from './actions'

export const dynamic = 'force-dynamic'

export default async function ProfessionalsPage() {
  const session = await requireAdmin()
  const supabase = createSupabaseServiceClient()

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, name, bio, is_active')
    .eq('tenant_id', session.tenantId)
    .order('name')

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold tracking-[-0.03em] text-stone-900">Profissionais</h1>
        <ProfessionalDialog
          trigger={
            <button className="rounded-xl bg-pink-500 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-600 transition-colors">
              Nova profissional
            </button>
          }
        />
      </div>

      {!professionals?.length ? (
        <p className="text-sm text-stone-500">Nenhuma profissional cadastrada.</p>
      ) : (
        <ul className="space-y-3">
          {professionals.map((professional) => (
            <li
              key={professional.id}
              className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">{professional.name}</p>
                {professional.bio && (
                  <p className="text-xs text-stone-500 mt-0.5">{professional.bio}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <ToggleProfessionalForm professionalId={professional.id} isActive={professional.is_active} />
                <ProfessionalDialog
                  professional={professional}
                  trigger={
                    <button className="text-xs text-stone-500 hover:text-stone-900">
                      Editar
                    </button>
                  }
                />
                <DeleteProfessionalForm professionalId={professional.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

async function ToggleProfessionalForm({
  professionalId,
  isActive,
}: {
  professionalId: string
  isActive: boolean
}) {
  async function toggle() {
    'use server'
    await toggleProfessional(professionalId, !isActive)
  }

  return (
    <form action={toggle}>
      <button
        type="submit"
        className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
          isActive
            ? 'bg-green-100 text-green-700 hover:bg-green-200'
            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
        }`}
      >
        {isActive ? 'Ativo' : 'Inativo'}
      </button>
    </form>
  )
}

async function DeleteProfessionalForm({ professionalId }: { professionalId: string }) {
  async function remove() {
    'use server'
    await deleteProfessional(professionalId)
  }

  return (
    <form action={remove}>
      <button type="submit" className="text-xs text-red-400 hover:text-red-600">
        Excluir
      </button>
    </form>
  )
}
