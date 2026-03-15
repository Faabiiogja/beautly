# Booking Flow — Design Spec

**Data:** 2026-03-14
**Status:** Aprovado
**Feature branch:** `feature/booking-flow`

---

## 1. Visão Geral

Fluxo público de agendamento acessível em `slug.beautly.com`. A cliente não cria conta — informa apenas nome e telefone. Após o agendamento, recebe um link por WhatsApp para visualizar os detalhes.

---

## 2. Rotas

```
app/
  page.tsx                     → landing page do salão
  book/
    page.tsx                   → passo 1: seleção de serviço
    [serviceId]/
      page.tsx                 → passo 2: profissional (se >1) + data/hora
    confirm/
      page.tsx                 → passo 3: nome + telefone
    done/
      page.tsx                 → confirmação final
  b/
    [token]/
      page.tsx                 → visualização do agendamento (read-only)
```

**Fluxo completo:**
```
Landing → /book → /book/[serviceId] → /book/confirm → /book/done
```

Quando o tenant tem apenas 1 profissional ativo, a seleção de profissional é transparente ao cliente — a página `/book/[serviceId]` exibe direto o calendário de disponibilidade.

Estado entre passos é passado via `searchParams` na URL (`serviceId`, `professionalId`, `slot`). Sem cookies nem sessionStorage.

---

## 3. Telas

### 3.1 Landing Page — `app/page.tsx`

- Hero com nome do salão, tagline "Agende seu horário com facilidade"
- Botão "Agendar agora" na cor primária do tenant (`primary_color`)
- Lista de serviços ativos com nome, preço e duração (contexto, não clicáveis)
- Ao clicar em "Agendar agora" → redirect `/book`
- Server Component — dados carregados via `getCurrentTenant()` + query de serviços

### 3.2 Seleção de Serviço — `app/book/page.tsx`

- Lista de serviços ativos do tenant (nome, duração, preço)
- Ao selecionar → redirect `/book/[serviceId]`
- Server Component

### 3.3 Profissional + Data/Hora — `app/book/[serviceId]/page.tsx`

**Se tenant tem >1 profissional ativo:**
- Cards de profissionais (nome, foto/avatar)
- Seleção obrigatória antes de mostrar calendário

**Se tenant tem 1 profissional ativo:**
- Passo de seleção omitido — profissional atribuído automaticamente

**Calendário de disponibilidade:**
- Mês atual com dias disponíveis destacados
- Ao selecionar dia → carrega horários disponíveis via `GET /api/availability`
- Slots exibidos em grade (ex: 09:00, 09:45, 10:30...)
- Ao selecionar slot → redirect `/book/confirm?serviceId=...&professionalId=...&slot=...`
- Calendário é Client Component (interatividade); resto da página é Server Component

**Parâmetros de URL ao avançar:**
```
/book/confirm?serviceId=uuid&professionalId=uuid&slot=2026-03-18T14:00:00Z
```

### 3.4 Formulário de Dados — `app/book/confirm/page.tsx`

- Resumo no topo: serviço, profissional, data/hora
- Campos: Nome completo, Telefone (formato BR)
- Botão "Confirmar agendamento"
- Server Action ao submeter: `confirmBooking()`
- Validação com Zod (nome obrigatório, telefone E.164)
- Erro de slot já ocupado: mensagem inline "Horário não disponível, escolha outro"
- Client Component (formulário interativo)

### 3.5 Confirmação — `app/book/done/page.tsx`

- Recebe `bookingId` via `searchParams`
- Server Component — carrega detalhes via `getBookingById(bookingId, tenantId)` onde `tenantId` vem de `getCurrentTenant()`. Query obrigatoriamente filtra `WHERE id = $1 AND tenant_id = $2` — booking de outro tenant retorna null (exibe mensagem genérica)
- Mensagem: "Agendado! Em breve você recebe o link por WhatsApp."
- Resumo do agendamento: serviço, profissional, data, hora
- Sem exibir o link `/b/[token]` — cliente recebe pelo WhatsApp
- Em `NODE_ENV === 'development'`: exibe o link visível para facilitar testes
- `bookingId` inválido: exibe mensagem genérica sem dados de resumo

### 3.6 Visualização do Agendamento — `app/b/[token]/page.tsx`

- Read-only — sem cancelamento ou reagendamento no MVP
- Badge de status: "Confirmado" (verde), "Cancelado" (vermelho)
- Detalhes: serviço, profissional, data, hora, nome do salão
- Mensagem: "Dúvidas? Entre em contato com o salão."
- Token inválido/expirado: mensagem "Este link não está mais disponível." — sem redirect
- Server Component

---

## 4. API

### `GET /api/availability`

Consulta slots disponíveis para um profissional em uma data.

**Query params:** `professionalId`, `serviceId`, `date` (YYYY-MM-DD) — `tenantId` derivado do host

**Response:**
```json
{ "slots": ["2026-03-18T09:00:00Z", "2026-03-18T09:45:00Z", ...] }
```

**Validação de tenant:** o handler verifica que `professional.tenant_id = tenantId` e `service.tenant_id = tenantId` antes de computar slots. Retorna 400 se qualquer um não pertencer ao tenant.

**Nota sobre `tenantId`:** o handler deriva `tenantId` do host header via `getCurrentTenant()` — não aceita `tenantId` como parâmetro de query. O cliente passa apenas `professionalId`, `serviceId` e `date`. Isso garante que o tenant seja sempre o da requisição atual.

**Lógica:** implementada em `lib/availability.ts` (já definida no MVP design doc):
1. Obtém `business_hours` do tenant para o dia da semana
2. Verifica `schedule_blocks` que cobrem a data
3. Gera todos os slots possíveis (duração + buffer do serviço)
4. Remove slots com overlap com bookings confirmados
5. Remove slots no passado

---

## 5. Server Action — `domain/bookings/actions.ts`

### `confirmBooking(formData)`

Chamada no submit do formulário de confirmação.

**Passos:**
1. Obtém `tenantId` via `getCurrentTenant()` (host header) — 404 se tenant inativo
2. Valida `formData` com Zod (nome, telefone, serviceId, professionalId, slot — UTC ISO-8601, obrigatório terminar com `Z` ou conter offset explícito)
3. Verifica que `service.tenant_id = tenantId` e `professional.tenant_id = tenantId` — 400 se não pertencerem ao tenant
4. Normaliza telefone para E.164
5. Re-valida slot server-side: chama `getAvailableSlots({ tenantId, professionalId, serviceId, date })` e verifica que o slot solicitado está na lista — se não estiver, retorna erro "Horário não disponível, escolha outro"
6. Calcula `ends_at = slot + service.duration_minutes + service.buffer_minutes`
7. Upsert em `customers`: `INSERT ... ON CONFLICT (tenant_id, phone) DO NOTHING` seguido de `SELECT id FROM customers WHERE tenant_id = ? AND phone = ?` — garante obtenção do `customer_id` independente de conflito
8. `INSERT INTO bookings` com `starts_at = slot`, `ends_at` calculado, `status = 'confirmed'` — se o índice `idx_no_double_booking` rejeitar (race condition), retorna erro "Horário não disponível"
9. `INSERT INTO booking_tokens` com `expires_at = ends_at + 2 dias`
10. Chama `whatsapp.sendBookingConfirmation()` (mockado em dev)
11. `redirect('/book/done?bookingId=...')`

**Nota sobre `idx_no_double_booking`:** é um `UNIQUE INDEX` em `(professional_id, starts_at) WHERE status NOT IN ('cancelled', 'rescheduled')` criado em `20260314000003_indexes.sql`. Suficiente para slots discretos gerados pelo algoritmo de disponibilidade.

---

## 6. WhatsApp

Interface em `lib/whatsapp.ts`:

```typescript
interface WhatsAppProvider {
  sendBookingConfirmation(phone: string, bookingUrl: string, tenantName: string): Promise<void>
}
```

- **Dev / `WHATSAPP_MOCK=true`:** loga no console + salva em `.mock-messages.json`
- **Produção:** implementação real via Meta Cloud API (fora do escopo deste MVP)

A estrutura está pronta para plugar a integração real sem alterar o código de chamada.

---

## 7. Lib de Disponibilidade — `lib/availability.ts`

```typescript
export async function getAvailableSlots(params: {
  tenantId: string
  professionalId: string
  serviceId: string
  date: string // YYYY-MM-DD no timezone do tenant
}): Promise<string[]> // retorna timestamps UTC
```

Algoritmo completo definido no MVP design doc (seção 12).

---

## 8. Segurança e Validação

- Zod em toda borda: `confirmBooking()` Server Action + `/api/availability`
- `phone` nunca retornado em responses públicas
- Token de 64 chars hex (256 bits de entropia) — `randomBytes(32).toString('hex')`
- Acesso ao `/b/[token]` é exclusivamente via link WhatsApp — sem cookie de conveniência no MVP
- Token válido: `expires_at > now()` AND `revoked_at IS NULL`. `used_at` não é marcado na visualização — campo reservado para uso futuro
- `revoked_at` não é definido pelo booking flow no MVP (sem cancelamento pelo cliente). Campo reservado para Fase 2
- Tenant ativo verificado em cada request via `getCurrentTenant()` — tenant inativo retorna 404
- `service_role` key em todas as queries do booking flow (sem auth do usuário)

---

## 9. Arquivos

```
app/
  page.tsx                              → landing page
  book/
    page.tsx                            → seleção de serviço
    [serviceId]/page.tsx                → profissional + calendário
    confirm/page.tsx                    → formulário nome + telefone
    done/page.tsx                       → confirmação
  b/[token]/page.tsx                    → visualização do agendamento

app/api/
  availability/route.ts                 → GET slots disponíveis

domain/bookings/
  actions.ts                            → confirmBooking() Server Action
  queries.ts                            → getBookingByToken(), getBookingById(), getBookingsByDate()
  types.ts                              → tipos de domínio

lib/
  availability.ts                       → getAvailableSlots()
  whatsapp.ts                           → interface + mock
  tokens.ts                             → generateBookingToken(), createBookingToken(), validateBookingToken()
```

---

## 10. Stack e Dependências

- Next.js 15 App Router (Server Components + Server Actions + Route Handlers)
- `@supabase/ssr` service client — queries sem RLS
- `zod` — validação de inputs
- `date-fns` + `date-fns-tz` — manipulação de datas e conversão de IANA timezones (`America/Sao_Paulo`)
- shadcn/ui `Calendar`, `Button`, `Input`, `Badge` — já instalados
- `crypto` (Node built-in) — geração de token

---

## 11. Decisões e Limitações Conhecidas

- **Rotas sem route group:** o booking flow usa caminhos reais (`app/page.tsx`, `app/book/`, `app/b/`) — não usa `app/(booking)/`. O MVP design doc mostrava route groups, mas a decisão final (consistente com o super-admin em `app/super-admin/`) é usar prefixos de path reais.
- **Nome do cliente não atualizado:** ao reagendar com nome diferente, o nome original é preservado. Decisão intencional do MVP — comportamento documentado, não bug.
- **Sem reserva temporária de slot:** slot pode ser perdido para outra cliente durante o preenchimento do formulário. A cliente recebe erro "Horário não disponível" e deve escolher outro.
- **WhatsApp:** mockado em dev via `WHATSAPP_MOCK=true`. Integração real (Meta Cloud API) fora do escopo deste MVP.
- **Cancelamento/reagendamento:** fora do escopo — apenas visualização em `/b/[token]`.

---

## 12. Notas de UX

- Cor primária do tenant aplicada nos botões e destaques de seleção
- Indicador de progresso no topo do wizard (ex: barra ou "Passo 2 de 3")
- Resumo do serviço selecionado persistente no topo de cada passo seguinte
- Mobile-first — área de toque mínima 44×44px, fonte ≥16px em inputs
- Sem reserva temporária de slot no MVP — slot pode ser perdido se outra cliente confirmar antes durante o preenchimento do formulário
