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
| Token | JWT assinado com `JWT_SECRET`, armazenado em cookie `sa_token` HttpOnly |
| Middleware | `x-context: super-admin` — middleware.ts já identifica esse contexto |

O middleware existente já trata `admin.beautly.com` sem tenant.

---

## 3. Proteção de Rotas e API

A proteção é feita em **duas camadas**:

1. **`middleware.ts` (root)** — já existente. Detecta `admin.beautly.com` e seta `x-context: super-admin`. Não verifica JWT — apenas identifica contexto.

2. **`lib/super-admin/auth.ts` — `requireSuperAdmin()`** — função chamada explicitamente no início de **cada Route Handler** e no **layout.tsx** do grupo `(super-admin)`. Lê o cookie `sa_token`, verifica JWT, lança `redirect('/admin/login')` se inválido. Não existe proteção implícita — cada handler é responsável por chamar `requireSuperAdmin()`.

Isso garante que tanto as páginas quanto as rotas de API (`/api/super-admin/*`) sejam protegidas, mesmo que o layout seja bypassado por fetch direto.

---

## 4. Telas

### 4.1 Login — `app/(super-admin)/login/page.tsx`

- Visual: dark, centralizado, mínimo
- Campos: email, senha
- Ação: POST para `/api/super-admin/auth`
  - Valida `email === SUPER_ADMIN_EMAIL` e `bcrypt.compare(password, SUPER_ADMIN_PASSWORD_HASH)`
  - Se ok: JWT `{ sub: "super-admin", exp: now+8h }` assinado com `JWT_SECRET`
  - Cookie: `sa_token=<jwt>; HttpOnly; SameSite=Strict; Path=/` — sem `Domain` explícito (scoped ao host atual, `admin.beautly.com`)
  - Redirect 302 → `/admin`
- Erro: mensagem genérica "Credenciais inválidas" — não distingue email/senha
- Sem "esqueci a senha" no MVP

### 4.2 Dashboard — `app/(super-admin)/page.tsx`

**Layout:** dark (`#0f172a`), single page. Topbar + métricas + tabela de tenants.

**Topbar:**
- "BEAUTLY ADMIN" com ponto rosa
- Email do admin + botão "sair" (form com POST para `/api/super-admin/logout` — **não um link**, pois precisa limpar cookie HttpOnly no servidor)

**Cards de métricas (3 colunas):**
| Card | Valor |
|---|---|
| MRR | Soma de `monthly_price` WHERE `status = 'active'` |
| Tenants Ativos | COUNT WHERE `status = 'active'` com subtexto "de N cadastrados" |
| Pausados | COUNT WHERE `status = 'inactive'` com nome do último pausado |

**Tabela de tenants — colunas:** Nome, Slug, Mensalidade, Status, Ações

**Status badges:**
| status DB | Badge | Cor |
|---|---|---|
| `active` | ativo | verde `#22c55e` / fundo `#14532d` |
| `inactive` | pausado | âmbar `#f59e0b` / fundo `#451a03` |
| `suspended` | suspenso | vermelho `#ef4444` / fundo `#450a0a` |

**Ações inline por linha:**
| Status atual | Ações disponíveis |
|---|---|
| `active` | "pausar" (→ `inactive`) + "✕" (deletar) |
| `inactive` | "ativar" (→ `active`) + "✕" (deletar) |
| `suspended` | "ativar" (→ `active`) + "✕" (deletar) — `suspended` é estado DB-only, reativável pelo admin |

**Feedback de erros nas ações CRUD:**
- Sucesso: revalida a página (Server Action com `revalidatePath`)
- Erro: toast com mensagem "Erro ao salvar. Tente novamente." usando `sonner` (já instalado via shadcn/ui)
- Delete sem sucesso: toast "Não foi possível deletar o tenant."

**Confirmação de delete:**
- Dialog shadcn/ui com texto "Tem certeza? Esta ação não pode ser desfeita."
- Delete em cascata garantido pelo `ON DELETE CASCADE` no schema

**Modal "Novo Tenant":**
- Campos visíveis: Nome, Slug (gerado automaticamente do nome, editável), Mensalidade (numeric, default `99.90`)
- Campos ocultos com defaults: `primary_color = '#ec4899'`, `timezone = 'America/Sao_Paulo'`, `status = 'active'`
- Ao criar: insere em `tenants` + insere 1 linha em `professionals` com `name = 'Profissional'`, `tenant_id = <novo>`, `is_active = true`, `sort_order = 0`
- Validações: slug único (verificado na API), slug regex `^[a-z0-9-]+$`
- Erro de slug duplicado: mensagem inline "Este slug já está em uso"

---

## 5. Rotas e Arquivos

```
app/
  (super-admin)/
    layout.tsx              # dark theme layout + chama requireSuperAdmin()
    login/
      page.tsx              # formulário de login
    page.tsx                # dashboard principal

app/api/
  super-admin/
    auth/route.ts           # POST login → JWT cookie
    logout/route.ts         # POST logout → limpa cookie + redirect
    tenants/
      route.ts              # GET list + POST create
      [id]/
        route.ts            # PATCH status (active/inactive) + DELETE

lib/
  super-admin/
    auth.ts                 # requireSuperAdmin(), createJWT(), verifyJWT()
```

---

## 6. Segurança

- JWT expira em 8h
- Cookie `HttpOnly; SameSite=Strict` — inacessível ao JavaScript do browser
- `Path=/` sem `Domain` explícito — scoped ao host atual (`admin.beautly.com`)
- Credenciais nunca no código — apenas em variáveis de ambiente
- Mensagem de erro genérica no login (sem oracle de email/senha)
- Cada Route Handler chama `requireSuperAdmin()` explicitamente
- Rate limiting: fora do MVP (acesso exclusivo do Fabio)

---

## 7. Visual

| Token | Valor |
|---|---|
| Fundo | `#0f172a` (slate-900) |
| Surface | `#1e293b` (slate-800) |
| Borda | `#334155` (slate-700) |
| Texto primário | `#f1f5f9` (slate-100) |
| Texto secundário | `#64748b` (slate-500) |
| Accent | `#ec4899` (pink-500) |
| Status ativo | `#22c55e` em `#14532d` |
| Status pausado | `#f59e0b` em `#451a03` |
| Status suspenso | `#ef4444` em `#450a0a` |

---

## 8. Stack e Dependências

- Next.js 15 App Router (Server Components + Route Handlers + Server Actions)
- `jose` — já instalado — para JWT
- `bcryptjs` — já instalado — para verificar senha
- `@supabase/ssr` service client — queries sem RLS
- shadcn/ui `Dialog` — modal de criação e confirmação de delete
- shadcn/ui `sonner` — toasts de feedback de erro
- Tailwind CSS — tema dark inline
