# Beautly UI v2 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recriar toda a camada de apresentação do Beautly (telas da cliente, painel da profissional e admin da plataforma) na identidade "Millennial & Lilás · Suave & Glow", sem alterar nenhuma regra de negócio.

**Architecture:** Redesenho de apresentação. Reescrevemos os tokens e classes componentizadas em `globals.css` (mantendo os nomes existentes para não quebrar telas durante a migração), criamos 3 componentes React compartilhados (`StatusBadge`, `ConfirmDialog` com Radix AlertDialog, `OtpInput`) e migramos cada tela trocando apenas JSX/CSS. Server actions, validação zod, escopo por `businessId`, OTP/sessão, schema, repositórios e serviços ficam intactos.

**Tech Stack:** Next.js (App Router), Tailwind CSS v4 (tokens em `@theme`), `@radix-ui/react-alert-dialog`, DM Sans + Fraunces (next/font).

**Spec:** [docs/superpowers/specs/2026-06-12-beautly-ui-v2-design.md](../specs/2026-06-12-beautly-ui-v2-design.md)

**Convenções de verificação:** Não há harness de testes de componente React neste repo (vitest cobre domínio/serviços com Postgres). A verificação de tarefas de UI é: `npm run lint` (sem novos warnings), `npm run build` (verde) e checagem visual mobile-first no navegador. A suíte `npm run test` existente deve permanecer intacta — nenhuma tarefa aqui toca em domínio/serviço.

**Regras preservadas (de CLAUDE.md):** UI 100% pt-BR com acentos; preços inteiros (`R$ 30`); datas via `formatInTimeZone`; nenhuma mudança em server actions / contratos `useActionState` / mensagens de erro.

---

## Fase 0 — Setup

### Task 0: Instalar dependência Radix

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Instalar @radix-ui/react-alert-dialog**

Run:
```bash
npm install @radix-ui/react-alert-dialog
```
Expected: instala e adiciona em `dependencies` sem erros de peer.

- [ ] **Step 2: Verificar que o projeto ainda builda**

Run: `npm run build`
Expected: build verde (sem uso ainda do pacote, só confirma que nada quebrou).

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @radix-ui/react-alert-dialog para o redesenho da UI"
```

---

## Fase 1 — Design system

### Task 1: Reescrever `globals.css` (tokens + classes)

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Substituir o conteúdo inteiro de `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  /* Rosa (primária) */
  --color-brand-50: #fcf6fa;
  --color-brand-100: #fbe9f2;
  --color-brand-200: #f7d6e7;
  --color-brand-300: #f3b6d3;
  --color-brand-400: #ec8fba;
  --color-brand-500: #ec6fa6;
  --color-brand-600: #d14a86;
  --color-brand-700: #b4356e;
  --color-brand-800: #8e2a57;
  --color-brand-900: #5e1c3a;

  /* Lilás (acento) */
  --color-lilac-50: #f6f1fd;
  --color-lilac-100: #ede3fb;
  --color-lilac-200: #e0d0f7;
  --color-lilac-300: #c9aef0;
  --color-lilac-400: #b79ced;
  --color-lilac-500: #9b6be0;
  --color-lilac-600: #7c53d6;
  --color-lilac-700: #6438be;

  /* Tinta (texto) */
  --color-ink-500: #8b8197;
  --color-ink-700: #4a3f5c;
  --color-ink-900: #2e2440;
}

@theme inline {
  --font-sans: var(--font-dm-sans), ui-sans-serif, system-ui, sans-serif;
  --font-display: var(--font-fraunces), ui-serif, Georgia, serif;
}

body {
  background-color: var(--color-brand-50);
  color: var(--color-ink-900);
  font-family: var(--font-sans);
}

@layer components {
  /* Superfícies */
  .card {
    @apply rounded-3xl border border-brand-100 bg-white p-6;
    box-shadow: 0 12px 32px -16px rgba(183, 156, 237, 0.45);
  }

  .shadow-glow {
    box-shadow: 0 12px 32px -16px rgba(183, 156, 237, 0.45);
  }

  /* Botões */
  .btn-primary {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50;
    background-image: linear-gradient(90deg, #ec6fa6, #b79ced);
    box-shadow: 0 10px 24px -8px rgba(183, 156, 237, 0.6);
  }
  .btn-primary:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 16px 30px -8px rgba(183, 156, 237, 0.7);
  }

  .btn-solid {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-secondary {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl border border-brand-200 bg-white px-5 py-3 text-sm font-semibold text-ink-700 transition hover:border-lilac-300 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50;
  }

  .btn-ghost {
    @apply inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-50;
  }

  /* Formulário */
  .input {
    @apply w-full rounded-2xl border border-brand-200 bg-white px-4 py-3 text-sm text-ink-900 placeholder:text-ink-500 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100;
  }

  .field-label {
    @apply mb-1.5 block text-sm font-medium text-ink-700;
  }

  .section-label {
    @apply text-xs font-semibold uppercase tracking-[0.12em] text-ink-500;
  }

  /* Chips de horário */
  .chip {
    @apply rounded-xl border border-brand-200 bg-white px-3 py-2 text-sm font-medium text-ink-700 transition hover:border-lilac-400 hover:text-lilac-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lilac-600;
  }

  .chip-selected {
    @apply border-lilac-600 bg-lilac-600 text-white hover:border-lilac-600 hover:text-white;
  }

  /* Badges e alertas */
  .badge {
    @apply inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium;
  }

  .alert-error {
    @apply rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700;
  }

  .alert-success {
    @apply rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700;
  }

  .alert-info {
    @apply rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-900;
  }

  /* Loading */
  .skeleton {
    @apply animate-pulse rounded-2xl bg-brand-100;
  }
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: build verde. As telas existentes renderizam com a nova paleta (classes mantêm os nomes).

- [ ] **Step 3: Checagem visual rápida**

Run: `npm run dev` e abrir `http://localhost:3000`.
Expected: landing aparece com fundo blush, botões em gradiente rosa→lilás, texto índigo. Sem layout quebrado.

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat(ui): novo design system Millennial & Lilás (Suave & Glow)"
```

---

## Fase 2 — Componentes compartilhados

### Task 2: `StatusBadge`

**Files:**
- Create: `src/components/status-badge.tsx`
- Modify: `src/app/[slug]/meus-agendamentos/list.tsx` (passa a usar o componente)

- [ ] **Step 1: Criar `src/components/status-badge.tsx`**

```tsx
const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELED_BY_CLIENT: "Cancelado por você",
  CANCELED_BY_PROFESSIONAL: "Cancelado pela profissional",
  RESCHEDULED: "Remarcado",
};

const STATUS_CLASS: Record<string, string> = {
  CONFIRMED: "bg-emerald-100 text-emerald-800",
  CANCELED_BY_CLIENT: "bg-zinc-100 text-zinc-600",
  CANCELED_BY_PROFESSIONAL: "bg-red-100 text-red-700",
  RESCHEDULED: "bg-lilac-100 text-lilac-700",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`badge ${STATUS_CLASS[status] ?? "bg-brand-100 text-brand-700"}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}
```

- [ ] **Step 2: Substituir o uso inline em `list.tsx`**

Em `src/app/[slug]/meus-agendamentos/list.tsx`: remover os mapas `STATUS_LABEL` e `STATUS_BADGE` (linhas ~26-38) e o `<span className={...}>{STATUS_LABEL...}</span>` (linhas ~91-95). Importar e usar:

```tsx
import { StatusBadge } from "@/components/status-badge";
// ...
<StatusBadge status={appointment.status} />
```

- [ ] **Step 3: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: sem erros; sem variáveis não usadas remanescentes em `list.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/status-badge.tsx src/app/[slug]/meus-agendamentos/list.tsx
git commit -m "feat(ui): componente StatusBadge"
```

### Task 3: `ConfirmDialog` (Radix AlertDialog)

**Files:**
- Create: `src/components/confirm-dialog.tsx`

- [ ] **Step 1: Criar `src/components/confirm-dialog.tsx`**

```tsx
"use client";

import * as AlertDialog from "@radix-ui/react-alert-dialog";
import { type ReactNode } from "react";

interface Props {
  /** O gatilho clicável (ex.: um botão). */
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  /** Chamado quando a usuária confirma. */
  onConfirm: () => void;
  danger?: boolean;
}

export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Voltar",
  onConfirm,
  danger = false,
}: Props) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <AlertDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-brand-100 bg-white p-6 shadow-glow focus:outline-none">
          <AlertDialog.Title className="font-display text-xl font-semibold text-ink-900">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-ink-700">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex gap-3">
            <AlertDialog.Cancel className="btn-secondary flex-1">
              {cancelLabel}
            </AlertDialog.Cancel>
            <AlertDialog.Action
              onClick={onConfirm}
              className={
                danger
                  ? "flex-1 inline-flex items-center justify-center rounded-2xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700"
                  : "btn-solid flex-1"
              }
            >
              {confirmLabel}
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
```

> Nota sobre animações: as classes `animate-in`/`fade-in` são de `tailwindcss-animate`, que **não** está instalado. Manter o atributo `data-[state=open]` mas remover `data-[state=open]:animate-in data-[state=open]:fade-in` se o build acusar classe desconhecida (Tailwind v4 ignora classes não definidas, então provavelmente não quebra; remover se houver warning).

- [ ] **Step 2: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: compila. (Componente ainda não usado — integração na Task 9.)

- [ ] **Step 3: Commit**

```bash
git add src/components/confirm-dialog.tsx
git commit -m "feat(ui): ConfirmDialog acessível com Radix AlertDialog"
```

### Task 4: `OtpInput` (código segmentado)

**Files:**
- Create: `src/components/otp-input.tsx`

- [ ] **Step 1: Criar `src/components/otp-input.tsx`**

```tsx
"use client";

import { useRef, useState } from "react";

interface Props {
  /** Nome do input oculto enviado no form (mantém `code`). */
  name?: string;
  length?: number;
}

export function OtpInput({ name = "code", length = 6 }: Props) {
  const [digits, setDigits] = useState<string[]>(Array(length).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const value = digits.join("");

  function setAt(index: number, char: string) {
    setDigits((current) => {
      const next = [...current];
      next[index] = char;
      return next;
    });
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    setAt(index, char);
    if (char && index < length - 1) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
    if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < length - 1)
      refs.current[index + 1]?.focus();
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    const next = Array(length).fill("");
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    refs.current[Math.min(pasted.length, length - 1)]?.focus();
  }

  return (
    <div>
      <input type="hidden" name={name} value={value} />
      <div className="flex justify-between gap-2" onPaste={handlePaste}>
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(el) => {
              refs.current[index] = el;
            }}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            aria-label={`Dígito ${index + 1} do código`}
            className="h-14 w-full rounded-2xl border border-brand-200 bg-white text-center text-xl font-semibold text-ink-900 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verificar lint + build**

Run: `npm run lint && npm run build`
Expected: compila. (Integração na Task 7.)

- [ ] **Step 3: Commit**

```bash
git add src/components/otp-input.tsx
git commit -m "feat(ui): OtpInput segmentado e acessível"
```

---

## Fase 3 — Telas da cliente (Suave & Glow pleno)

> **Para cada tarefa de tela:** primeiro LEIA o arquivo atual inteiro, depois reescreva o JSX aplicando o design system. **Não** altere imports de dados, props, server actions, nem nomes de campos de formulário. Verificação sempre: `npm run lint && npm run build` + checagem visual.

### Task 5: Landing `/`

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Ler `src/app/page.tsx`** e manter os arrays `steps`/`benefits` e a estrutura semântica (header, hero, "como funciona", benefícios+preço, footer).

- [ ] **Step 2: Aplicar o redesenho**, com estas mudanças concretas:
  - Hero: fundo `bg-gradient-to-b from-brand-50 to-white`; no `<h1>`, aplicar gradiente no texto de destaque via `bg-gradient-to-r from-brand-600 to-lilac-500 bg-clip-text text-transparent` na palavra "organizada".
  - Trocar `.btn-primary px-6 py-3` mantendo (já é gradiente agora).
  - Card de preço: usar `border-lilac-200 bg-gradient-to-br from-brand-50 to-lilac-50`.
  - Cards de passos: número em círculo com `bg-gradient-to-br from-brand-500 to-lilac-400 text-white`.
  - Ícones de check em `text-lilac-600`.
  - Trocar textos cinza `text-zinc-600` por `text-ink-700`, `text-zinc-500` por `text-ink-500`, títulos `text-zinc-900` por `text-ink-900`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual: hero com gradiente no texto, CTA óbvio, card de preço destacado.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat(ui): redesenho da landing"
```

### Task 6: Página pública `/[slug]`

**Files:**
- Modify: `src/app/[slug]/page.tsx`

- [ ] **Step 1: Ler o arquivo.** Preservar `findBusinessBySlug`, `listActiveServices`, `whatsappLink`, `notFound()` e o caso `status !== "ACTIVE"`.

- [ ] **Step 2: Redesenho:**
  - Header do negócio (card): avatar/logo maior; fallback com inicial em `bg-gradient-to-br from-brand-500 to-lilac-400 text-white`.
  - Título "Escolha um serviço" usando `.section-label`.
  - Cada serviço como card clicável: hover `hover:border-lilac-300` + leve elevação; preço em `text-brand-600 font-bold`; seta em `text-lilac-400`.
  - CTA "Ver meus agendamentos" com `.btn-secondary w-full`.
  - Trocar tons `zinc-*` por `ink-*` conforme Task 5.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual mobile: lista de serviços tocável e legível.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[slug]/page.tsx"
git commit -m "feat(ui): redesenho da página pública do negócio"
```

### Task 7: Agendamento `/[slug]/agendar` (page + booking-form com OtpInput)

**Files:**
- Modify: `src/app/[slug]/agendar/page.tsx`
- Modify: `src/app/[slug]/agendar/booking-form.tsx`

- [ ] **Step 1: Ler ambos os arquivos.** Em `booking-form.tsx`, **preservar** toda a lógica: `useActionState`, `sendCodeAction`/`confirmAction`, estados `chosen`/`phone`/`sendState`/`confirmState`, os `<input type="hidden">` (`slug`, `serviceId`, `startAt`) e os nomes de campos (`customerName`, `phone`, `code`).

- [ ] **Step 2: Redesenho do `booking-form.tsx`:**
  - Cabeçalhos "1 · Escolha data e horário" e "2 · Seus dados" usando `.section-label`, com um indicador de passo (círculo numerado em gradiente).
  - Grid de horários: manter `grid grid-cols-4 gap-2` e as classes `.chip`/`.chip-selected` (já retunadas).
  - **Substituir** o `<input id="code" name="code" ...>` (linhas ~162-175) pelo componente:
    ```tsx
    import { OtpInput } from "@/components/otp-input";
    // ...
    <div>
      <label className="field-label">Código de confirmação</label>
      <OtpInput name="code" />
    </div>
    ```
  - Manter o botão "Receber código por telefone" (`.btn-secondary`) e "Confirmar agendamento" (`.btn-primary`), com os mesmos `disabled`/labels.
  - Caixa de resumo (`alert-info`) com a data/hora escolhida mantida.

- [ ] **Step 3: Redesenho do `page.tsx`** (header/títulos com os tokens novos; preservar a busca de dados e o `<BookingForm .../>`).

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual: OTP em 6 células; colar código distribui nas células; navegação por seta/Backspace funciona; submit envia `code` corretamente.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[slug]/agendar/page.tsx" "src/app/[slug]/agendar/booking-form.tsx"
git commit -m "feat(ui): redesenho do fluxo de agendamento com OTP segmentado"
```

### Task 8: Confirmação `/[slug]/agendar/confirmado`

**Files:**
- Modify: `src/app/[slug]/agendar/confirmado/page.tsx`

- [ ] **Step 1: Ler o arquivo.** Preservar os dados exibidos.

- [ ] **Step 2: Redesenho:** tela de sucesso celebrativa — ícone de check em círculo com gradiente `from-brand-500 to-lilac-400`, título em `font-display`, resumo do agendamento em card, CTAs (ver meus agendamentos / voltar à página) com `.btn-primary`/`.btn-secondary`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual: sensação de conclusão positiva.

- [ ] **Step 4: Commit**

```bash
git add "src/app/[slug]/agendar/confirmado/page.tsx"
git commit -m "feat(ui): redesenho da tela de confirmação"
```

### Task 9: Meus agendamentos (page + access-form + list com ConfirmDialog)

**Files:**
- Modify: `src/app/[slug]/meus-agendamentos/page.tsx`
- Modify: `src/app/[slug]/meus-agendamentos/access-form.tsx`
- Modify: `src/app/[slug]/meus-agendamentos/list.tsx`

- [ ] **Step 1: Ler os três arquivos.** Preservar `cancelAction`/`rescheduleAction`, `useActionState`, estados `openId`/`chosen`, os `<input type="hidden">` (`slug`, `id`, `startAt`, `date`) e o uso de `formatInTimeZone`.

- [ ] **Step 2: `list.tsx` — substituir o `confirm()` nativo por `ConfirmDialog`.** O bloco atual (linhas ~109-124) é um `<form action={cancelAction} onSubmit={confirm()...}>`. Trocar por: manter o `<form>` com os hidden inputs e um botão de submit interno; usar `ConfirmDialog` cujo `trigger` é um `.btn-secondary` "Cancelar" (texto vermelho) e cujo `onConfirm` dispara o submit do form. Padrão:
  ```tsx
  import { ConfirmDialog } from "@/components/confirm-dialog";
  // dentro do map, ref para o form de cancelamento:
  const cancelFormRef = useRef<HTMLFormElement>(null); // por item — ver nota
  // ...
  <form ref={cancelFormRef} action={cancelAction} className="flex-1">
    <input type="hidden" name="slug" value={slug} />
    <input type="hidden" name="id" value={appointment.id} />
    <ConfirmDialog
      danger
      title="Cancelar agendamento?"
      description="Esta ação não pode ser desfeita. A profissional será avisada."
      confirmLabel="Sim, cancelar"
      trigger={
        <button
          type="button"
          className="btn-secondary w-full py-2 text-xs text-red-600 hover:border-red-300 hover:text-red-700"
        >
          Cancelar
        </button>
      }
      onConfirm={() => cancelFormRef.current?.requestSubmit()}
    />
  </form>
  ```
  > Nota: como há múltiplos itens no `.map`, NÃO use um único `useRef` no topo. Em vez disso, extraia o item para um componente filho `AppointmentCard` que tem seu próprio `useRef`, OU use `event` a partir do `trigger` para achar o form pai via `closest("form")`. Recomendado: extrair `AppointmentCard` (mantém o `useRef` por card e melhora a legibilidade do arquivo grande).

- [ ] **Step 3: Aplicar tokens novos** nos três arquivos (cards, chips, alerts já retunados; trocar `zinc-*` → `ink-*`). Usar `StatusBadge` (já integrado na Task 2).

- [ ] **Step 4: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual: clicar "Cancelar" abre o diálogo Radix (foco preso, ESC fecha); confirmar dispara `cancelAction`. Remarcar continua funcionando.

- [ ] **Step 5: Commit**

```bash
git add "src/app/[slug]/meus-agendamentos/"
git commit -m "feat(ui): redesenho de meus agendamentos com diálogo de cancelamento"
```

---

## Fase 4 — Painel da profissional (versão sóbria)

> **Versão sóbria:** usar `.btn-solid` (rosa chapado) em vez de `.btn-primary` (gradiente) para ações funcionais; menos glow; mais espaço em branco. Cards permanecem mas com sombra discreta.

### Task 10: Layout, nav e copy-link do admin

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/app/admin/nav.tsx`
- Modify: `src/app/admin/copy-link.tsx`

- [ ] **Step 1: Ler os três.** Preservar guards/sessão no layout e a lógica de `usePathname` no nav.

- [ ] **Step 2: Redesenho:**
  - `nav.tsx`: aba ativa com `bg-brand-50 text-brand-700` (manter), inativa `text-ink-500 hover:bg-brand-50/60 hover:text-ink-900`.
  - `layout.tsx`: cabeçalho com a marca "Beautly" em `font-display text-brand-700`, container `max-w-3xl`, fundo `brand-50`.
  - `copy-link.tsx`: botão com `.btn-secondary`, estado "copiado" com check em `text-lilac-600`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde. Visual: navegação clara, sóbria.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/app/admin/nav.tsx src/app/admin/copy-link.tsx
git commit -m "feat(ui): redesenho do shell do painel (layout/nav)"
```

### Task 11: Login da profissional

**Files:**
- Modify: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Ler.** Preservar a server action de login e os campos.

- [ ] **Step 2: Redesenho:** card centralizado (`max-w-sm mx-auto`), marca no topo, inputs `.input`, botão `.btn-solid w-full`, alerta de erro `.alert-error`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat(ui): redesenho do login da profissional"
```

### Task 12: Dashboard `/admin`

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Ler.** Preservar dados (agenda do dia, link público, atalhos).

- [ ] **Step 2: Redesenho:** cabeçalho de saudação; bloco do link público com `copy-link`; atalhos como cards; lista do dia legível. Tokens novos; `.btn-solid` para ações.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(ui): redesenho do dashboard da profissional"
```

### Task 13: Agenda do dia `/admin/agenda`

**Files:**
- Modify: `src/app/admin/agenda/page.tsx`

- [ ] **Step 1: Ler.** Preservar a busca de agendamentos do dia e qualquer ação (ex.: marcar status).

- [ ] **Step 2: Redesenho:** seletor de data claro; lista/timeline dos agendamentos com `StatusBadge`; estados vazios com `.alert-info`. Se houver ação destrutiva/confirmação, reutilizar `ConfirmDialog`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/agenda/page.tsx
git commit -m "feat(ui): redesenho da agenda do dia"
```

### Task 14: Serviços `/admin/services`

**Files:**
- Modify: `src/app/admin/services/page.tsx`

- [ ] **Step 1: Ler.** Preservar as server actions de CRUD e campos.

- [ ] **Step 2: Redesenho:** lista de serviços em cards (nome, duração, preço `R$`), form de criar/editar com `.input`/`.btn-solid`; exclusão via `ConfirmDialog` se aplicável.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/services/page.tsx
git commit -m "feat(ui): redesenho de serviços"
```

### Task 15: Perfil do negócio `/admin/business` (page + form)

**Files:**
- Modify: `src/app/admin/business/page.tsx`
- Modify: `src/app/admin/business/form.tsx`

- [ ] **Step 1: Ler ambos.** Preservar a server action de atualização, upload de logo e os nomes de campos.

- [ ] **Step 2: Redesenho:** form com `.input`/`.field-label`; área de upload de logo com preview circular; botão salvar `.btn-solid`; alertas de sucesso/erro.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/business/page.tsx src/app/admin/business/form.tsx
git commit -m "feat(ui): redesenho do perfil do negócio"
```

### Task 16: Horários `/admin/business/hours` (page + form)

**Files:**
- Modify: `src/app/admin/business/hours/page.tsx`
- Modify: `src/app/admin/business/hours/hours-form.tsx`

- [ ] **Step 1: Ler ambos.** Preservar a server action e a estrutura de dados dos horários.

- [ ] **Step 2: Redesenho:** grade de dias da semana; toggles/inputs de horário com `.input`/`.chip`; botão salvar `.btn-solid`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/business/hours/page.tsx src/app/admin/business/hours/hours-form.tsx
git commit -m "feat(ui): redesenho dos horários de atendimento"
```

---

## Fase 5 — Plataforma (versão sóbria)

### Task 17: Login, dashboard e nova profissional da plataforma

**Files:**
- Modify: `src/app/platform/login/page.tsx`
- Modify: `src/app/platform/layout.tsx`
- Modify: `src/app/platform/page.tsx`
- Modify: `src/app/platform/professionals/new/page.tsx`

- [ ] **Step 1: Ler os quatro.** Preservar guards de papel `PLATFORM_ADMIN`, server actions e campos.

- [ ] **Step 2: Redesenho (sóbrio, igual ao admin):**
  - `login/page.tsx`: card centralizado, igual ao login admin (Task 11) com identidade plataforma.
  - `layout.tsx`: shell sóbrio com marca.
  - `page.tsx`: lista de profissionais em cards/tabela legível com `StatusBadge` quando houver status.
  - `professionals/new/page.tsx`: form de cadastro com `.input`/`.btn-solid`.

- [ ] **Step 3: Verificar**

Run: `npm run lint && npm run build`
Expected: verde.

- [ ] **Step 4: Commit**

```bash
git add src/app/platform/
git commit -m "feat(ui): redesenho das telas da plataforma"
```

---

## Fase 6 — Verificação final

### Task 18: Verificação integral

- [ ] **Step 1: Lint + build limpos**

Run: `npm run lint && npm run build`
Expected: zero erros, zero novos warnings.

- [ ] **Step 2: Suíte de testes intacta**

Run: `npm run test`
Expected: todos os testes existentes passam (nenhum tocado). Requer Postgres de teste (`.env.test`).

- [ ] **Step 3: Passagem visual mobile-first**

Run: `npm run dev` e percorrer, em viewport mobile e desktop:
landing → `/[slug]` → agendar (incluindo OTP) → confirmado → meus-agendamentos (incluindo cancelar via diálogo) → admin (login, dashboard, agenda, serviços, negócio, horários) → platform.
Expected: identidade consistente; estados hover/active/disabled visíveis; nada quebrado; acentos corretos em pt-BR.

- [ ] **Step 4: Commit final (se houver ajustes)**

```bash
git add -A
git commit -m "chore(ui): ajustes finais do redesenho"
```

---

## Notas de execução

- **Não** alterar server actions, validação zod, escopo `businessId`, OTP/sessão, schema, repositórios ou serviços. Qualquer necessidade de mudança aí está fora deste plano — pare e sinalize.
- Em arquivos grandes (ex.: `list.tsx`), extrair componentes-filho (`AppointmentCard`) é encorajado para manter foco e legibilidade.
- Manter os nomes dos campos de formulário e dos `<input type="hidden">` exatamente como estão — as server actions dependem deles.
- Preços sempre inteiros (`R$ {price}`), datas sempre via `formatInTimeZone`.
