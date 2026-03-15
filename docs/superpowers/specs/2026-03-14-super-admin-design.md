# Super Admin — Design Spec

**Data:** 2026-03-14
**Status:** Aprovado
**Feature branch:** `feature/super-admin`

---

## 1. Visão Geral

Painel interno exclusivo do Fabio (dono da plataforma) acessível em `admin.beautly.com`. Permite monitorar o negócio (MRR, tenants) e gerenciar tenants (criar, pausar, deletar). Escopo mínimo e intencional — não é um produto para clientes.

---

## 2. Contexto de Acesso

| Item | Detalhe |
|---|---|
| URL | `admin.beautly.com` |
| Auth | Email + senha via variáveis de ambiente (`SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD_HASH`) |
| Token | JWT assinado com `JWT_SECRET`, armazenado em cookie `httpOnly` |
| Middleware | `x-context: super-admin` — middleware já identifica esse contexto |

O middleware existente já trata `admin.beautly.com` sem tenant. A proteção é feita por middleware de rota que verifica o JWT.

---

## 3. Telas

### 3.1 Login — `app/(super-admin)/login/page.tsx`

- Visual: dark, centralizado, mínimo
- Campos: email, senha
- Ação: POST para `/api/super-admin/auth` → valida contra env vars → retorna JWT em cookie `httpOnly; SameSite=Strict`
- Erro: mensagem genérica "Credenciais inválidas" (sem distinguir email/senha)
- Redirect: após login bem-sucedido → `/admin`
- Nenhuma funcionalidade de "esqueci a senha" no MVP

### 3.2 Dashboard — `app/(super-admin)/page.tsx`

**Layout:** dark (`#0f172a`), single page. Topbar + métricas + tabela.

**Topbar:**
- Logo/nome "BEAUTLY ADMIN" com ponto rosa
- Email do admin + link "sair" (limpa cookie JWT → redirect `/admin/login`)

**Cards de métricas (3 colunas):**
| Card | Valor | Detalhe |
|---|---|---|
| MRR | Soma de `monthly_price` dos tenants `active` | Variação do mês (opcional MVP) |
| Tenants Ativos | COUNT WHERE status = 'active' | "de N cadastrados" |
| Pausados | COUNT WHERE status = 'inactive' | Nome do último pausado |

**Tabela de tenants:**
- Colunas: Nome, Slug, Mensalidade, Status, Ações
- Status badge: `active` → verde, `inactive` → âmbar
- Ações inline por linha:
  - Se `active`: botão "pausar" (→ `inactive`) + botão "✕" (deletar)
  - Se `inactive`: botão "ativar" (→ `active`) + botão "✕" (deletar)
- Botão "+ Novo Tenant" no header da tabela → abre modal

**Modal "Novo Tenant":**
- Campos: Nome, Slug (gerado automaticamente do nome, editável), Mensalidade
- Ação: POST → cria registro em `tenants` + profissional padrão no seed
- Validações: slug único, slug apenas letras minúsculas e hífens

**Confirmação de delete:**
- Alert/dialog de confirmação antes de deletar
- Delete em cascata (já garantido pelo `ON DELETE CASCADE` no schema)

---

## 4. Rotas e Arquivos

```
app/
  (super-admin)/
    layout.tsx          # dark theme layout + auth guard
    login/
      page.tsx          # formulário de login
    page.tsx            # dashboard principal

app/api/
  super-admin/
    auth/route.ts       # POST login → JWT cookie
    logout/route.ts     # POST logout → limpa cookie
    tenants/
      route.ts          # GET list + POST create
      [id]/route.ts     # PATCH status + DELETE

lib/
  super-admin/
    auth.ts             # verifyJWT(), createJWT(), hashCompare()
```

---

## 5. Autenticação — Fluxo Completo

```
POST /api/super-admin/auth
  body: { email, password }
  → compara com SUPER_ADMIN_EMAIL + bcrypt.compare(password, SUPER_ADMIN_PASSWORD_HASH)
  → se ok: assina JWT com { sub: "super-admin", exp: 8h } usando JWT_SECRET
  → Set-Cookie: sa_token=<jwt>; HttpOnly; SameSite=Strict; Path=/
  → redirect 302 → /admin
```

Middleware de rota (`app/(super-admin)/layout.tsx`) lê o cookie, verifica JWT a cada request. Se inválido → redirect `/admin/login`.

---

## 6. Segurança

- JWT expira em 8h
- Cookie `HttpOnly` — inacessível ao JavaScript do browser
- Credenciais **nunca** no código — apenas nas variáveis de ambiente
- Mensagem de erro genérica no login (sem oracle de email)
- Rate limiting: não no MVP (acesso exclusivo do Fabio via IP conhecido)

---

## 7. Visual

- Fundo: `#0f172a` (slate-900)
- Surface: `#1e293b` (slate-800)
- Borda: `#334155` (slate-700)
- Texto primário: `#f1f5f9` (slate-100)
- Texto secundário: `#64748b` (slate-500)
- Accent: `#ec4899` (pink-500) — consistente com brand Beautly
- Status ativo: `#22c55e` (green-500) em fundo `#14532d`
- Status pausado: `#f59e0b` (amber-500) em fundo `#451a03`
- Status deletar: `#ef4444` (red-500)

---

## 8. Stack e Dependências

- Next.js 15 App Router (Server Components + Route Handlers)
- `jose` — já no projeto — para JWT
- `bcryptjs` — já no projeto — para comparar senha
- `@supabase/ssr` service client — para queries sem RLS
- shadcn/ui Dialog — para modal de criação e confirmação de delete
- Tailwind CSS — customização inline do tema dark
