// app/super-admin/_components/tenant-actions.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

// ─── Toggle status (pausar / ativar) ────────────────────────────────────────

interface ToggleStatusButtonProps {
  id: string
  currentStatus: string
}

export function ToggleStatusButton({ id, currentStatus }: ToggleStatusButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const nextStatus = currentStatus === 'active' ? 'inactive' : 'active'
  const label = currentStatus === 'active' ? 'pausar' : 'ativar'
  const color = currentStatus === 'active' ? '#f59e0b' : '#22c55e'

  async function handleToggle() {
    const res = await fetch(`/api/super-admin/tenants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    })

    if (res.ok) {
      startTransition(() => router.refresh())
    } else {
      toast.error('Erro ao salvar. Tente novamente.')
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      style={{
        color,
        border: `1px solid ${color}`,
        background: 'transparent',
        borderRadius: '4px',
        padding: '2px 8px',
        fontSize: '11px',
        cursor: isPending ? 'not-allowed' : 'pointer',
        opacity: isPending ? 0.5 : 1,
      }}
    >
      {isPending ? '...' : label}
    </button>
  )
}

// ─── Delete button + dialog de confirmação ───────────────────────────────────

interface DeleteTenantButtonProps {
  id: string
  name: string
}

export function DeleteTenantButton({ id, name }: DeleteTenantButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleDelete() {
    const res = await fetch(`/api/super-admin/tenants/${id}`, { method: 'DELETE' })

    if (res.ok) {
      setOpen(false)
      startTransition(() => router.refresh())
    } else {
      toast.error('Não foi possível deletar o tenant.')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          color: '#ef4444',
          border: '1px solid #ef4444',
          background: 'transparent',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px',
          cursor: 'pointer',
        }}
      >
        ✕
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f1f5f9' }}>Deletar tenant</DialogTitle>
            <DialogDescription style={{ color: '#94a3b8' }}>
              Tem certeza que deseja deletar <strong style={{ color: '#f1f5f9' }}>{name}</strong>?
              Esta ação não pode ser desfeita e remove todos os dados associados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button
              onClick={() => setOpen(false)}
              style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}
            >
              Cancelar
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Deletando...' : 'Deletar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Modal de criação de tenant ──────────────────────────────────────────────

interface CreateTenantButtonProps {
  defaultMonthlyPrice: number
}

export function CreateTenantButton({ defaultMonthlyPrice }: CreateTenantButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [slugError, setSlugError] = useState<string | null>(null)

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSlugError(null)
    setIsPending(true)

    const form = new FormData(e.currentTarget)
    const name = form.get('name') as string
    const slug = form.get('slug') as string
    const monthly_price = parseFloat(form.get('monthly_price') as string)

    const res = await fetch('/api/super-admin/tenants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, slug, monthly_price }),
    })

    if (res.ok) {
      setOpen(false)
      router.refresh()
    } else {
      const data = await res.json()
      if (data.error?.includes('slug')) {
        setSlugError(data.error)
      } else {
        toast.error(data.error ?? 'Erro ao criar tenant.')
      }
    }

    setIsPending(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ background: '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
      >
        + Novo Tenant
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent style={{ background: '#1e293b', border: '1px solid #334155', color: '#f1f5f9' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#f1f5f9' }}>Novo Tenant</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} id="create-tenant-form">
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>NOME</label>
              <input
                name="name"
                required
                onChange={(e) => {
                  const slugInput = document.getElementById('slug-input') as HTMLInputElement
                  if (slugInput && !slugInput.dataset.edited) {
                    slugInput.value = generateSlug(e.target.value)
                  }
                }}
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>SLUG</label>
              <input
                id="slug-input"
                name="slug"
                required
                pattern="^[a-z0-9-]+"
                onInput={(e) => { (e.target as HTMLInputElement).dataset.edited = 'true' }}
                style={{ width: '100%', background: '#0f172a', border: `1px solid ${slugError ? '#ef4444' : '#334155'}`, borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
              {slugError && <p style={{ color: '#ef4444', fontSize: '11px', marginTop: '4px' }}>{slugError}</p>}
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ display: 'block', color: '#64748b', fontSize: '11px', marginBottom: '6px', letterSpacing: '0.06em' }}>MENSALIDADE (R$)</label>
              <input
                name="monthly_price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={defaultMonthlyPrice}
                required
                style={{ width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', padding: '8px 10px', color: '#f1f5f9', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </form>

          <DialogFooter>
            <button onClick={() => setOpen(false)} style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}>
              Cancelar
            </button>
            <button
              type="submit"
              form="create-tenant-form"
              disabled={isPending}
              style={{ background: '#ec4899', color: '#fff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer' }}
            >
              {isPending ? 'Criando...' : 'Criar'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
