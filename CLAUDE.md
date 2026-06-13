@AGENTS.md

# Beautly

Plataforma de agendamento online para profissionais autônomas de estética
(manicure, lash, sobrancelha, depilação, cabelo, maquiagem). MVP validando o
modelo: mensalidade de R$ 30/mês por profissional, com duas pilotos gratuitas.

- **Negócio:** Documento de Escopo de Negócio (seções numeradas, ex: "regra 11.3").
- **Design técnico:** `docs/superpowers/specs/2026-06-12-beautly-mvp-design.md`
- **Planos de implementação:** `docs/superpowers/plans/`

## Papéis

| Papel | Área | Acesso |
|-------|------|--------|
| Cliente final | `/[slug]`, `/[slug]/agendar`, `/[slug]/meus-agendamentos` | Sem conta; telefone verificado por OTP (cookie `beautly_client`, 30 min) |
| Profissional | `/admin` | E-mail + senha, role `PROFESSIONAL` (cookie `beautly_session`) |
| Admin da plataforma | `/platform` | E-mail + senha, role `PLATFORM_ADMIN` |

## Stack e arquitetura

Next.js (App Router) + Postgres via Prisma. Monolito em camadas:

- `src/domain` — regras puras sem DB (slots, conflitos, janela de 15 dias). TDD aqui.
- `src/services` — orquestram domínio + Prisma; **todo escopo por `businessId` mora aqui**.
- `src/repositories` — acesso a dados, sempre escopado por `businessId`.
- `src/ports` + `src/adapters` — `OtpSender` (mock em dev: imprime no console) e
  `FileStorage` (`DbFileStorage` em uso: salva bytes no Postgres, serve via
  `/api/files/[key]` — o filesystem da Vercel é somente leitura).
- `src/lib` — prisma, sessões (iron-session), guards, telefone, timezone.
- `proxy.ts` — guarda rasa por cookie para `/admin` e `/platform` (Next 16 usa
  `proxy.ts`, não `middleware.ts`); a checagem real de papel é nos guards de servidor.

## Comandos

```bash
npm run dev          # dev server
npm run test         # vitest (precisa do Postgres de teste, .env.test)
npm run lint         # eslint
npm run build        # build de produção
npx prisma db push   # aplicar schema (sem migrations neste projeto)
npx prisma db seed   # cria o admin da plataforma (exige ADMIN_PASSWORD)
```

Atenção: o Postgres local roda atrás de pgbouncer — `prisma db push` falha com
"prepared statement already exists". Aplique DDL via `$executeRawUnsafe` num
script tsx (ver histórico) ou use uma conexão direta.

## Regras inegociáveis (segurança / negócio)

1. **Isolamento multi-tenant (regra 9.1):** nenhuma query sem `businessId`.
   Página pública resolve pelo `slug`; áreas logadas pegam da sessão. Updates
   usam `updateMany({ where: { id, businessId } })` e checam `count`.
2. **Disponibilidade é revalidada no servidor:** `confirmBooking` e
   `rescheduleByClient` chamam `assertSlotOffered` (slot precisa estar na lista
   gerada por `availableSlots`) + `assertSlotFree` dentro da transação (corrida).
   Nunca confie no `startAt` vindo do cliente.
3. **OTP:** gerado com `crypto.randomInt`, hash com bcrypt, expira em 10 min,
   5 tentativas (incremento atômico), cooldown de 60s e máx. 5/hora por
   telefone+negócio (`OtpRateLimitError`).
4. **Login:** lockout por e-mail após 5 falhas em 15 min (`LoginRateLimitError`,
   tabela `LoginAttempt`).
5. **Telefones:** sempre normalizar com `normalizePhone` (só dígitos) antes de
   salvar/comparar — é a identidade da cliente.
6. **Uploads:** só PNG/JPEG/WebP até 2MB, salvos no Postgres (`StoredFile`).
7. **Sessões:** `SESSION_SECRET` ≥ 32 chars (validado em runtime); cookies
   httpOnly, `secure` em produção, sameSite lax.
8. **Seed:** nunca criar senha padrão; `ADMIN_PASSWORD` é obrigatória.
9. **Simplicidade do MVP (regra 9.4):** na dúvida entre regra avançada e
   simples, escolha a simples. Fora de escopo: pagamento, múltiplos
   profissionais, relatórios, lembretes automáticos (seção 8 do escopo).

## Convenções

- UI inteira em **pt-BR, com acentos corretos**, voz direta para usuárias não
  técnicas (evitar jargão).
- Estilo: Tailwind v4 com tokens em `globals.css` (`--color-brand-*`) e classes
  componentizadas (`.card`, `.btn-primary`, `.input`, `.chip`, `.badge`,
  `.alert-*`). Fontes: DM Sans (texto) e Fraunces (display) via `next/font`.
- Preços são **inteiros em reais** (sem centavos): exibir como `R$ 30`.
- Datas em UTC no banco; renderizar com `formatInTimeZone` no timezone do
  negócio (`America/Sao_Paulo` default). Helpers em `src/lib/timezone.ts`.
- Server actions: validar com zod na borda, retornar `{ error }` amigável via
  `useActionState`; nunca vazar mensagens internas.
- Testes de serviço usam Postgres real (`resetDb()` trunca tabelas — adicionar
  tabelas novas lá ao mudar o schema).

## Deploy (Vercel)

- Env obrigatórias: `DATABASE_URL`, `SHADOW_DATABASE_URL`, `SESSION_SECRET`,
  `APP_URL`, e `ADMIN_EMAIL`/`ADMIN_PASSWORD` para o seed.
- Headers de segurança e `poweredByHeader: false` em `next.config.ts`.
- Não gravar em disco em runtime (filesystem read-only) — usar `FileStorage`.
- O OTP em produção ainda usa `MockOtpSender` (código vai para os logs!) —
  trocar por adapter real (Twilio/WhatsApp) em `src/lib/otp-provider.ts` antes
  de abrir para clientes reais.
