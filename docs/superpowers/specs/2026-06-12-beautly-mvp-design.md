# Beautly MVP — Documento de Design

- **Data:** 2026-06-12
- **Status:** Aprovado para planejamento de implementação
- **Base de negócio:** Documento de Escopo de Negócio — Beautly

---

## 1. Resumo

O Beautly é uma plataforma de agendamento online para profissionais autônomas de
estética (manicure, lash, sobrancelha, depilação, cabelo, maquiagem etc.). O MVP
permite que uma profissional cadastre serviços, configure sua agenda e divulgue uma
página pública própria; a cliente final escolhe serviço, data e horário, informa nome
e telefone (verificado por OTP), confirma o agendamento e pode consultar, cancelar ou
remarcar. Um administrador da plataforma cadastra e ativa/inativa profissionais.

Este documento descreve a arquitetura técnica do MVP. As regras de negócio referenciadas
(ex: "regra 11.3") são do Documento de Escopo de Negócio.

---

## 2. Decisões fechadas (brainstorming)

| Tema | Decisão |
|------|---------|
| Stack | Next.js (App Router) + Postgres via Prisma — monolito em camadas |
| Arquitetura | Domínio puro separado de serviços, repositórios e framework |
| Agenda base | Horário semanal fixo por dia da semana (`start`/`end`) + granularidade de slots; fechar dia = exceção |
| Confirmação de telefone | OTP real, abstraído atrás de uma porta (`OtpSender`); mock no dev |
| Login painel | E-mail + senha, sessão por cookie, papéis `PLATFORM_ADMIN` / `PROFESSIONAL` |
| Cliente final | Sem conta; identificada por telefone verificado por OTP |
| Logotipo | Incluído no MVP → armazenamento de arquivos atrás de uma porta (`FileStorage`); disco local no dev |
| Preços | Inteiros em reais, **sem centavos** |
| Datas | Armazenadas em UTC, renderizadas no timezone do negócio (default `America/Sao_Paulo`) |
| Janela de agendamento | Próximos **15 dias**, sem horários passados |
| Status de agendamento | `CONFIRMED`, `CANCELED_BY_CLIENT`, `CANCELED_BY_PROFESSIONAL`, `RESCHEDULED` (sem "Realizado"/"Não compareceu") |
| Remarcação | Antigo vira `RESCHEDULED`; cria novo `CONFIRMED` ligado por `rescheduledFromId` |

---

## 3. Modelo de domínio (Prisma / Postgres)

### `User` — login do painel
- `id`, `email` (único), `passwordHash`
- `role`: `PLATFORM_ADMIN` | `PROFESSIONAL`
- `businessId?` (nulo para admin da plataforma)
- timestamps
- MVP: 1 profissional = 1 negócio.

### `Business` — o tenant
- `id`, `slug` (único, usado na URL pública, ex: `/maria-nails`)
- `name` (nome do negócio), `contactPhone`
- `defaultMessage?` (mensagem padrão de atendimento)
- `logoUrl?`
- `timezone` (default `America/Sao_Paulo`)
- `slotIntervalMinutes` (granularidade dos slots, ex: 30)
- `status`: `ACTIVE` | `INACTIVE`
- timestamps

### `Service`
- `id`, `businessId`
- `name`
- `price` (inteiro, reais, sem centavos)
- `durationMinutes`
- `active` (bool)
- timestamps

### `WeeklyHours` — disponibilidade base
- `businessId`, `weekday` (0–6)
- `isOpen` (bool)
- `startTime`, `endTime`
- Uma linha por dia da semana por negócio.

### `DayClosure` — exceção de "fechar dia inteiro"
- `businessId`, `date`
- A presença da linha indica dia fechado (regras 11.5–11.7).

### `Appointment`
- `id`, `businessId`, `serviceId`
- `customerName`, `customerPhone`
- `startAt` (timestamptz), `endAt` (timestamptz)
- `status`: `CONFIRMED` | `CANCELED_BY_CLIENT` | `CANCELED_BY_PROFESSIONAL` | `RESCHEDULED`
- **Snapshots** (regras 10.7/10.8): `serviceNameSnapshot`, `priceSnapshot` (inteiro reais), `durationSnapshot`
- `rescheduledFromId?` (liga o novo agendamento ao antigo numa remarcação)
- timestamps
- Cliente identificada apenas por `customerPhone` — **sem tabela `Customer`**.

### `OtpVerification`
- `id`, `businessId`, `phone`
- `codeHash`, `expiresAt`, `attempts`, `consumedAt?`
- Usada para provar posse do telefone antes de agendar e antes de consultar "Meus agendamentos".

---

## 4. Arquitetura de módulos

```
/app
  /[slug]                     → página pública do negócio + fluxo de agendamento
  /[slug]/meus-agendamentos   → consulta/cancelar/remarcar (telefone + OTP)
  /admin                      → área da profissional (agenda, serviços, config)
  /platform                   → área do admin da plataforma (CRUD de profissionais)
  /api/...                    → route handlers (enviar/verificar OTP, upload de logo)
/src
  /domain        → regras puras, sem DB: cálculo de disponibilidade, detecção de
                   conflito, janela de 15 dias, validação de horário passado
  /services      → orquestram domínio + repositórios; aqui mora o escopo por businessId
                   (Booking, Availability, ServiceCatalog, Business, Auth, Otp)
  /repositories  → acesso a dados via Prisma, sempre escopado por businessId
  /ports         → interfaces: OtpSender, FileStorage
  /adapters      → MockOtpSender (console, dev/teste) + LocalFileStorage (dev);
                   stubs documentados para Twilio/S3 trocarem depois
  /lib           → prisma client, sessão/cookie, validação (zod)
/prisma/schema.prisma
```

**Princípios:**
- O cálculo de disponibilidade e a detecção de conflito são funções **puras** no `/domain`:
  recebem agenda + agendamentos + serviço e retornam slots, sem tocar no banco. A regra mais
  crítica (não permitir conflito de horário) fica testável de forma isolada.
- **Isolamento multi-tenant (regra 9.1):** toda consulta passa pela camada de serviço, que
  injeta o `businessId`. Repositórios nunca são chamados sem `businessId`. Página pública
  resolve `businessId` pelo `slug`; áreas logadas pegam do usuário da sessão.

---

## 5. Fluxos-chave

### 5.1 Cálculo de disponibilidade (função pura)
Dado `serviceId` e uma data:
1. Negócio `ACTIVE` e serviço `active`? Senão, sem horários (regras 9.2, 19.3).
2. `WeeklyHours` do dia: se `isOpen=false` ou existe `DayClosure` na data → dia indisponível.
3. Gera candidatos de `startTime` a `endTime` a cada `slotIntervalMinutes`.
4. Descarta candidato se `início + durationMinutes > endTime` (regra 11.4), se está no passado
   (regra 21.2) ou fora dos 15 dias (regra 12.10 ajustada).
5. Descarta candidato que **sobreponha** qualquer `Appointment` `CONFIRMED` do negócio
   (intervalos `[start,end)` se cruzam → regra 11.3). Retorna os slots livres.

### 5.2 Agendamento (cliente)
Serviço → data → horário → nome + telefone → OTP → revisão → confirmar.
Na confirmação, `BookingService`, **dentro de uma transação**, revalida a disponibilidade
(evita corrida entre duas clientes no mesmo slot), grava `Appointment` `CONFIRMED` com os
snapshots de nome/preço/duração, e retorna dados para a confirmação visual (serviço, data,
hora, negócio, mensagem padrão — regra 17.1).

### 5.3 Consultar "Meus agendamentos"
Telefone → OTP → lista agendamentos *daquele negócio* ligados ao telefone verificado
(isolamento 18.3). De lá, cancelar ou remarcar.

### 5.4 Cancelamento (cliente)
Confirma intenção → status `CANCELED_BY_CLIENT` → slot volta a ficar livre automaticamente
(a disponibilidade só considera `CONFIRMED`). Sem multa (regra 20.1).

### 5.5 Remarcação (cliente)
Nova data/horário (mesmas regras de disponibilidade) → transação: antigo vira `RESCHEDULED`,
cria novo `CONFIRMED` com `rescheduledFromId` (regra 13.4). Slot antigo libera, novo ocupa.

### 5.6 Profissional — cancelar / fechar dia
- Cancelar agendamento → `CANCELED_BY_PROFESSIONAL` (comunicação manual via WhatsApp, regra 12.13).
- Fechar dia → cria `DayClosure`: bloqueia *novos* agendamentos; **não** cancela os existentes;
  a profissional decide caso a caso (regra 11.7). Reabrir = remove o `DayClosure`.

### 5.7 OTP (atrás da porta)
`OtpService.send(phone)` gera código, grava hash + expiração, chama `OtpSender` (mock imprime
no console em dev). `verify(phone, code)` confere hash, expiração e tentativas, marca
`consumedAt`. Integração real (Twilio/WhatsApp) troca apenas o adapter.

---

## 6. Autenticação, papéis e isolamento

- **Sessão** por cookie httpOnly assinado; senha com hash (bcrypt/argon2).
- **Papéis:** `PLATFORM_ADMIN` acessa `/platform`; `PROFESSIONAL` acessa `/admin` e enxerga só
  o próprio `businessId`. Middleware protege ambas as áreas e redireciona não autenticados.
- **Admin cadastra profissional** com e-mail + dados básicos do negócio e define se nasce
  `ACTIVE`/`INACTIVE`; senha inicial definida pelo admin ou via primeiro acesso (detalhe no plano).
- **Cliente final não tem conta** — só telefone verificado por OTP; leitura limitada ao negócio
  + telefone.
- **Isolamento (regra 9.1):** nenhuma query sem `businessId`. Negócio `INACTIVE` → página pública
  mostra aviso e bloqueia novos agendamentos, mantendo histórico (regra 9.2).

---

## 7. Erros e casos de borda

- **Corrida no mesmo slot:** revalidação dentro da transação na confirmação; se tomado, erro
  amigável "horário não está mais disponível" e volta para a lista.
- **Negócio sem serviços ativos / sem horários:** mensagens claras (regras 19.3/19.4), sem avançar.
- **Dados mínimos do negócio (9.3):** página só fica "pronta" com nome, telefone, ≥1 serviço
  ativo, agenda e status ativo; faltando algo, painel avisa a profissional.
- **OTP:** código expirado, errado ou excesso de tentativas → mensagens específicas e reenvio
  com limite.
- **Validação de entrada:** zod em toda borda (server actions / route handlers) — telefone, nome,
  preço inteiro ≥ 0, duração > 0, horários coerentes (`start < end`).
- **Serviço/negócio inativado no meio do fluxo:** revalidação na confirmação rejeita o agendamento.

---

## 8. Estratégia de testes

- **Unitários (foco):** funções puras do `/domain` — geração de slots, sobreposição/conflito,
  janela de 15 dias, horário passado, encaixe da duração. Regras 11.3/11.4/21.x viram testes.
- **Serviços:** `BookingService` (incl. corrida/transação), `OtpService`, isolamento por
  `businessId` (uma profissional não vê dados de outra).
- **Integração:** fluxo de agendamento ponta a ponta com Postgres de teste; cancelar/remarcar
  liberando e ocupando slots.
- **Abordagem:** TDD onde a regra de negócio é não-trivial (disponibilidade/conflito primeiro).

---

## 9. Fora do escopo do MVP

Conforme seção 8 do documento de negócio: pagamento online, cobrança da mensalidade, múltiplos
profissionais por negócio, escolha de profissional pela cliente, dashboards/relatórios avançados,
lembretes automáticos, fidelidade, cupons, lista de espera, avaliações, app mobile nativo,
marketplace/busca pública, agendamento recorrente, multa por cancelamento, entre outros. Status
"Realizado" e "Não compareceu" também ficam fora desta versão.

---

## 10. Critérios de aceite

Os 18 critérios da seção 28 do documento de negócio. Em resumo, o MVP está pronto quando:
profissional pode ser cadastrada/ativada/inativada pelo admin; profissional ativa configura
negócio, serviços (nome/preço/duração) e agenda; cliente acessa a página pública, vê serviços
ativos, escolhe data/horário disponível, informa e verifica telefone, confirma agendamento,
consulta, cancela e remarca; dia fechado e serviço/negócio inativo bloqueiam novos agendamentos;
e o sistema impede conflito de horários — tudo com experiência simples para usuárias não técnicas.
