# Beautly MVP — Plano 3: Área da Profissional

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir que a profissional logada configure seu negócio (nome, telefone, mensagem padrão, logotipo, granularidade de slots), edite horários semanais, gerencie serviços (criar/editar/ativar/inativar), veja a agenda por dia, feche/reabra dias e cancele atendimentos.

**Architecture:** Serviços de aplicação escopados pelo `businessId` da sessão. Helpers de timezone convertem dias locais do negócio em intervalos UTC para consultar agendamentos. Upload de logo via route handler usando a porta `FileStorage`. Páginas Server Components + Server Actions.

**Tech Stack:** Next.js App Router, Prisma, Zod, date-fns-tz, Vitest.

**Depende de:** Planos 1 e 2 concluídos.

---

## Estrutura de arquivos deste plano

- `src/app/admin/login/page.tsx` + `actions.ts`, `src/app/admin/logout/route.ts` — auth profissional
- `src/lib/timezone.ts` (+test) — conversões de dia local ↔ UTC e weekday
- `src/services/business-service.ts` (+test) — get/update negócio, prontidão
- `src/services/service-catalog.ts` (+test) — CRUD de serviços
- `src/services/agenda-service.ts` (+test) — agenda por dia, fechar/reabrir, cancelar
- `src/app/admin/page.tsx` — dashboard + prontidão
- `src/app/admin/business/*` — config do negócio + horários
- `src/app/admin/services/*` — serviços
- `src/app/admin/agenda/*` — agenda
- `src/app/api/logo/route.ts` — upload de logo

---

### Task 1: Login e logout da profissional

**Files:**
- Create: `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`, `src/app/admin/logout/route.ts`

A action reaproveita `authenticate` e `getSession` do Plano 2; só muda o redirect e o login destino.

- [ ] **Step 1: Action de login**

Create `src/app/admin/login/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authenticate } from "@/services/auth-service";
import { getSession } from "@/lib/session";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result || result.role !== "PROFESSIONAL") {
    return { error: "E-mail ou senha incorretos." };
  }

  const session = await getSession();
  session.userId = result.userId;
  session.role = result.role;
  session.businessId = result.businessId;
  await session.save();
  redirect("/admin");
}
```

- [ ] **Step 2: Página de login**

Create `src/app/admin/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-xl font-semibold">Beautly — Profissional</h1>
      <form action={action} className="space-y-4">
        <input name="email" type="email" placeholder="E-mail" required className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Senha" required className="w-full rounded border p-2" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Logout**

Create `src/app/admin/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(
    new URL("/admin/login", process.env.APP_URL ?? "http://localhost:3000"),
  );
}
```

Adicione `APP_URL="http://localhost:3000"` ao `.env` e `.env.example`.

- [ ] **Step 4: Compilar e commitar**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/app/admin/login src/app/admin/logout .env.example
git commit -m "feat: professional login/logout"
```

---

### Task 2: Helpers de timezone (TDD)

Converter um dia "YYYY-MM-DD" no fuso do negócio para o intervalo UTC `[início, fim)` e descobrir o dia da semana local. Usado pela agenda (este plano) e pela disponibilidade (Plano 4).

**Files:**
- Create: `src/lib/timezone.ts`, `src/lib/timezone.test.ts`

- [ ] **Step 1: Instalar date-fns-tz**

```bash
npm install date-fns date-fns-tz
```

- [ ] **Step 2: Teste que falha**

Create `src/lib/timezone.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { dayRangeUtc, localWeekday, minutesToUtc } from "./timezone";

const TZ = "America/Sao_Paulo"; // UTC-3 (sem horário de verão atualmente)

describe("dayRangeUtc", () => {
  it("maps a local day to a 24h UTC window", () => {
    const { start, end } = dayRangeUtc("2026-06-15", TZ);
    // 2026-06-15 00:00 -03:00 == 03:00Z
    expect(start.toISOString()).toBe("2026-06-15T03:00:00.000Z");
    expect(end.toISOString()).toBe("2026-06-16T03:00:00.000Z");
  });
});

describe("localWeekday", () => {
  it("returns the weekday in the business timezone (0=Sun)", () => {
    // 2026-06-15 é uma segunda-feira
    expect(localWeekday("2026-06-15", TZ)).toBe(1);
  });
});

describe("minutesToUtc", () => {
  it("converts minutes-from-midnight on a local day to a UTC instant", () => {
    // 09:00 local (540) em -03:00 == 12:00Z
    expect(minutesToUtc("2026-06-15", 540, TZ).toISOString()).toBe(
      "2026-06-15T12:00:00.000Z",
    );
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/lib/timezone.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar**

Create `src/lib/timezone.ts`:

```typescript
import { fromZonedTime } from "date-fns-tz";

/** Início (inclusivo) e fim (exclusivo) em UTC de um dia local "YYYY-MM-DD". */
export function dayRangeUtc(dateStr: string, timeZone: string) {
  const start = fromZonedTime(`${dateStr}T00:00:00`, timeZone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

/** Instante UTC para `minutes` desde a meia-noite local do dia. */
export function minutesToUtc(dateStr: string, minutes: number, timeZone: string): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, timeZone);
}

/** Dia da semana (0=domingo) da data civil "YYYY-MM-DD". */
export function localWeekday(dateStr: string, _timeZone: string): number {
  // O dia da semana de uma data civil independe do fuso; calcula ao meio-dia UTC
  // para evitar qualquer borda de virada de dia.
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/lib/timezone.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commitar**

```bash
git add src/lib/timezone.ts src/lib/timezone.test.ts
git commit -m "feat: timezone helpers"
```

---

### Task 3: business-service + prontidão (TDD)

**Files:**
- Create: `src/services/business-service.ts`, `src/services/business-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/business-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import {
  getBusiness,
  updateBusinessProfile,
  isBusinessReady,
} from "./business-service";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const r = await createProfessional({
    businessName: "Maria Nails",
    slug: "maria-nails",
    contactPhone: "11999999999",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = r.businessId;
});

describe("updateBusinessProfile", () => {
  it("updates editable fields only", async () => {
    await updateBusinessProfile(businessId, {
      name: "Maria Nails Studio",
      contactPhone: "11000000000",
      defaultMessage: "Chegue 10min antes.",
      slotIntervalMinutes: 60,
    });
    const b = await getBusiness(businessId);
    expect(b.name).toBe("Maria Nails Studio");
    expect(b.slotIntervalMinutes).toBe(60);
    expect(b.defaultMessage).toBe("Chegue 10min antes.");
  });
});

describe("isBusinessReady", () => {
  it("is false without an active service", async () => {
    expect(await isBusinessReady(businessId)).toBe(false);
  });

  it("is true with active business, service and open weekday", async () => {
    await prisma.service.create({
      data: {
        businessId,
        name: "Manicure",
        price: 30,
        durationMinutes: 40,
        active: true,
      },
    });
    expect(await isBusinessReady(businessId)).toBe(true);
  });

  it("is false when business is inactive", async () => {
    await prisma.service.create({
      data: { businessId, name: "Manicure", price: 30, durationMinutes: 40, active: true },
    });
    await prisma.business.update({ where: { id: businessId }, data: { status: "INACTIVE" } });
    expect(await isBusinessReady(businessId)).toBe(false);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/business-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/services/business-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export function getBusiness(businessId: string) {
  return prisma.business.findUniqueOrThrow({ where: { id: businessId } });
}

export interface BusinessProfileInput {
  name: string;
  contactPhone: string;
  defaultMessage?: string | null;
  slotIntervalMinutes: number;
}

export async function updateBusinessProfile(
  businessId: string,
  input: BusinessProfileInput,
) {
  await prisma.business.update({
    where: { id: businessId },
    data: {
      name: input.name,
      contactPhone: input.contactPhone,
      defaultMessage: input.defaultMessage ?? null,
      slotIntervalMinutes: input.slotIntervalMinutes,
    },
  });
}

export async function updateLogoUrl(businessId: string, logoUrl: string) {
  await prisma.business.update({ where: { id: businessId }, data: { logoUrl } });
}

/** Regra 9.3: negócio pronto = ativo + ≥1 serviço ativo + ≥1 dia da semana aberto. */
export async function isBusinessReady(businessId: string): Promise<boolean> {
  const business = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  if (business.status !== "ACTIVE") return false;
  if (!business.contactPhone || !business.name) return false;

  const activeServices = await prisma.service.count({
    where: { businessId, active: true },
  });
  if (activeServices === 0) return false;

  const openDays = await prisma.weeklyHours.count({
    where: { businessId, isOpen: true },
  });
  return openDays > 0;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/business-service.test.ts`
Expected: todos passam.

- [ ] **Step 5: Commitar**

```bash
git add src/services/business-service.ts src/services/business-service.test.ts
git commit -m "feat: business profile service and readiness check"
```

---

### Task 4: service-catalog (TDD)

**Files:**
- Create: `src/services/service-catalog.ts`, `src/services/service-catalog.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/service-catalog.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import {
  createService,
  updateService,
  setServiceActive,
  listServices,
  listActiveServices,
} from "./service-catalog";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const r = await createProfessional({
    businessName: "Maria Nails",
    slug: "maria-nails",
    contactPhone: "11999999999",
    email: "maria@beautly.com",
    password: "senha123",
    startActive: true,
  });
  businessId = r.businessId;
});

describe("service-catalog", () => {
  it("creates and lists a service", async () => {
    const s = await createService(businessId, {
      name: "Manicure",
      price: 30,
      durationMinutes: 40,
    });
    expect(s.active).toBe(true);
    const all = await listServices(businessId);
    expect(all).toHaveLength(1);
  });

  it("edits a service", async () => {
    const s = await createService(businessId, { name: "Manicure", price: 30, durationMinutes: 40 });
    await updateService(businessId, s.id, { name: "Manicure Premium", price: 45, durationMinutes: 50 });
    const all = await listServices(businessId);
    expect(all[0]).toMatchObject({ name: "Manicure Premium", price: 45, durationMinutes: 50 });
  });

  it("inactivating hides from active list but keeps it in full list", async () => {
    const s = await createService(businessId, { name: "Manicure", price: 30, durationMinutes: 40 });
    await setServiceActive(businessId, s.id, false);
    expect(await listActiveServices(businessId)).toHaveLength(0);
    expect(await listServices(businessId)).toHaveLength(1);
  });

  it("does not edit a service from another business", async () => {
    const other = await createProfessional({
      businessName: "Ana", slug: "ana", contactPhone: "1", email: "ana@x.com", password: "senha123", startActive: true,
    });
    const s = await createService(other.businessId, { name: "X", price: 10, durationMinutes: 20 });
    await expect(
      updateService(businessId, s.id, { name: "Hack", price: 1, durationMinutes: 1 }),
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/service-catalog.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/services/service-catalog.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export interface ServiceInput {
  name: string;
  price: number;
  durationMinutes: number;
}

export function createService(businessId: string, input: ServiceInput) {
  return prisma.service.create({
    data: { businessId, ...input, active: true },
  });
}

/** Atualiza apenas se o serviço pertencer ao negócio (isolamento, regra 9.1). */
export async function updateService(
  businessId: string,
  serviceId: string,
  input: ServiceInput,
) {
  const result = await prisma.service.updateMany({
    where: { id: serviceId, businessId },
    data: input,
  });
  if (result.count === 0) throw new Error("Serviço não encontrado.");
}

export async function setServiceActive(
  businessId: string,
  serviceId: string,
  active: boolean,
) {
  const result = await prisma.service.updateMany({
    where: { id: serviceId, businessId },
    data: { active },
  });
  if (result.count === 0) throw new Error("Serviço não encontrado.");
}

export function listServices(businessId: string) {
  return prisma.service.findMany({ where: { businessId }, orderBy: { createdAt: "asc" } });
}

export function listActiveServices(businessId: string) {
  return prisma.service.findMany({
    where: { businessId, active: true },
    orderBy: { createdAt: "asc" },
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/service-catalog.test.ts`
Expected: todos passam.

- [ ] **Step 5: Commitar**

```bash
git add src/services/service-catalog.ts src/services/service-catalog.test.ts
git commit -m "feat: service catalog"
```

---

### Task 5: agenda-service (TDD)

Lista agendamentos `CONFIRMED` de um dia (no fuso do negócio), fecha/reabre dia e cancela como profissional. O fechamento **não** cancela agendamentos existentes (regra 11.7).

**Files:**
- Create: `src/services/agenda-service.ts`, `src/services/agenda-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/agenda-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";
import {
  listAppointmentsByDay,
  closeDay,
  reopenDay,
  isDayClosed,
  cancelByProfessional,
} from "./agenda-service";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
  const r = await createProfessional({
    businessName: "Maria Nails", slug: "maria-nails", contactPhone: "1",
    email: "maria@beautly.com", password: "senha123", startActive: true,
  });
  businessId = r.businessId;
  const s = await createService(businessId, { name: "Manicure", price: 30, durationMinutes: 40 });
  serviceId = s.id;
});

async function makeAppointment(startIso: string) {
  return prisma.appointment.create({
    data: {
      businessId, serviceId, customerName: "Cliente", customerPhone: "11999999999",
      startAt: new Date(startIso), endAt: new Date(startIso),
      serviceNameSnapshot: "Manicure", priceSnapshot: 30, durationSnapshot: 40,
    },
  });
}

describe("listAppointmentsByDay", () => {
  it("returns only confirmed appointments within the local day", async () => {
    // 2026-06-15 12:00Z == 09:00 -03:00 (dentro do dia local)
    await makeAppointment("2026-06-15T12:00:00.000Z");
    // 2026-06-16 12:00Z == outro dia
    await makeAppointment("2026-06-16T12:00:00.000Z");
    const list = await listAppointmentsByDay(businessId, "2026-06-15", "America/Sao_Paulo");
    expect(list).toHaveLength(1);
  });
});

describe("closeDay / reopenDay", () => {
  it("marks a day closed and reopens it without touching appointments", async () => {
    const appt = await makeAppointment("2026-06-15T12:00:00.000Z");
    await closeDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(true);

    const still = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(still.status).toBe("CONFIRMED"); // não cancela (regra 11.7)

    await reopenDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(false);
  });

  it("closing twice is idempotent", async () => {
    await closeDay(businessId, "2026-06-15");
    await closeDay(businessId, "2026-06-15");
    expect(await isDayClosed(businessId, "2026-06-15")).toBe(true);
  });
});

describe("cancelByProfessional", () => {
  it("sets status to CANCELED_BY_PROFESSIONAL", async () => {
    const appt = await makeAppointment("2026-06-15T12:00:00.000Z");
    await cancelByProfessional(businessId, appt.id);
    const updated = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(updated.status).toBe("CANCELED_BY_PROFESSIONAL");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/agenda-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/services/agenda-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { dayRangeUtc } from "@/lib/timezone";

export async function listAppointmentsByDay(
  businessId: string,
  dateStr: string,
  timeZone: string,
) {
  const { start, end } = dayRangeUtc(dateStr, timeZone);
  return prisma.appointment.findMany({
    where: {
      businessId,
      status: "CONFIRMED",
      startAt: { gte: start, lt: end },
    },
    orderBy: { startAt: "asc" },
  });
}

export async function closeDay(businessId: string, dateStr: string) {
  await prisma.dayClosure.upsert({
    where: { businessId_date: { businessId, date: new Date(`${dateStr}T00:00:00.000Z`) } },
    create: { businessId, date: new Date(`${dateStr}T00:00:00.000Z`) },
    update: {},
  });
}

export async function reopenDay(businessId: string, dateStr: string) {
  await prisma.dayClosure.deleteMany({
    where: { businessId, date: new Date(`${dateStr}T00:00:00.000Z`) },
  });
}

export async function isDayClosed(businessId: string, dateStr: string): Promise<boolean> {
  const found = await prisma.dayClosure.findUnique({
    where: { businessId_date: { businessId, date: new Date(`${dateStr}T00:00:00.000Z`) } },
  });
  return found !== null;
}

export async function cancelByProfessional(businessId: string, appointmentId: string) {
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, businessId },
    data: { status: "CANCELED_BY_PROFESSIONAL" },
  });
  if (result.count === 0) throw new Error("Agendamento não encontrado.");
}
```

`DayClosure.date` é coluna `@db.Date`; gravamos sempre à meia-noite UTC para ter uma chave estável por dia civil.

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/agenda-service.test.ts`
Expected: todos passam.

- [ ] **Step 5: Commitar**

```bash
git add src/services/agenda-service.ts src/services/agenda-service.test.ts
git commit -m "feat: agenda service (list/close/reopen/cancel)"
```

---

### Task 6: Dashboard + edição de horários semanais

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/business/hours/page.tsx`, `src/app/admin/business/hours/actions.ts`
- Add ao `business-service.ts`: `getWeeklyHours` / `updateWeeklyHours`

- [ ] **Step 1: Adicionar funções de horários ao business-service**

Adicione ao final de `src/services/business-service.ts`:

```typescript
export function getWeeklyHours(businessId: string) {
  return prisma.weeklyHours.findMany({
    where: { businessId },
    orderBy: { weekday: "asc" },
  });
}

export interface WeeklyHoursRow {
  weekday: number;
  isOpen: boolean;
  startTime: string;
  endTime: string;
}

export async function updateWeeklyHours(businessId: string, rows: WeeklyHoursRow[]) {
  await prisma.$transaction(
    rows.map((row) =>
      prisma.weeklyHours.update({
        where: { businessId_weekday: { businessId, weekday: row.weekday } },
        data: { isOpen: row.isOpen, startTime: row.startTime, endTime: row.endTime },
      }),
    ),
  );
}
```

- [ ] **Step 2: Action de horários**

Create `src/app/admin/business/hours/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth-guard";
import { updateWeeklyHours } from "@/services/business-service";

export async function saveHoursAction(formData: FormData) {
  const session = await requireProfessional();
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    isOpen: formData.get(`open-${weekday}`) === "on",
    startTime: String(formData.get(`start-${weekday}`) || "09:00"),
    endTime: String(formData.get(`end-${weekday}`) || "18:00"),
  }));
  await updateWeeklyHours(session.businessId!, rows);
  revalidatePath("/admin/business/hours");
}
```

- [ ] **Step 3: Página de horários**

Create `src/app/admin/business/hours/page.tsx`:

```tsx
import { requireProfessional } from "@/lib/auth-guard";
import { getWeeklyHours } from "@/services/business-service";
import { saveHoursAction } from "./actions";

const NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default async function HoursPage() {
  const session = await requireProfessional();
  const hours = await getWeeklyHours(session.businessId!);

  return (
    <main className="mx-auto max-w-xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Horários de atendimento</h1>
      <form action={saveHoursAction} className="space-y-3">
        {hours.map((h) => (
          <div key={h.weekday} className="flex items-center gap-3">
            <label className="flex w-32 items-center gap-2">
              <input type="checkbox" name={`open-${h.weekday}`} defaultChecked={h.isOpen} />
              {NAMES[h.weekday]}
            </label>
            <input type="time" name={`start-${h.weekday}`} defaultValue={h.startTime} className="rounded border p-1" />
            <span>até</span>
            <input type="time" name={`end-${h.weekday}`} defaultValue={h.endTime} className="rounded border p-1" />
          </div>
        ))}
        <button className="rounded bg-black px-4 py-2 text-white">Salvar</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 4: Dashboard com prontidão**

Create `src/app/admin/page.tsx`:

```tsx
import Link from "next/link";
import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness, isBusinessReady } from "@/services/business-service";

export default async function AdminHome() {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  const ready = await isBusinessReady(business.id);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-2 text-xl font-semibold">{business.name}</h1>
      {!ready && (
        <p className="mb-4 rounded bg-yellow-100 p-3 text-sm">
          Sua página ainda não está pronta. Confira: status ativo, telefone, ao menos um
          serviço ativo e um dia da semana aberto.
        </p>
      )}
      <nav className="grid gap-3">
        <Link href="/admin/agenda" className="rounded border p-3">Agenda</Link>
        <Link href="/admin/services" className="rounded border p-3">Serviços</Link>
        <Link href="/admin/business" className="rounded border p-3">Dados do negócio</Link>
        <Link href="/admin/business/hours" className="rounded border p-3">Horários</Link>
        <p className="text-sm text-gray-500">
          Link público: <code>/{business.slug}</code>
        </p>
      </nav>
      <form action="/admin/logout" method="post" className="mt-6">
        <button className="text-sm text-gray-500 underline">Sair</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Compilar e commitar**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/app/admin/page.tsx src/app/admin/business/hours src/services/business-service.ts
git commit -m "feat: admin dashboard and weekly hours editor"
```

---

### Task 7: Dados do negócio + upload de logo

**Files:**
- Create: `src/app/admin/business/page.tsx`, `src/app/admin/business/actions.ts`
- Create: `src/app/api/logo/route.ts`

- [ ] **Step 1: Action de dados do negócio**

Create `src/app/admin/business/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth-guard";
import { updateBusinessProfile } from "@/services/business-service";

const schema = z.object({
  name: z.string().min(1),
  contactPhone: z.string().min(8),
  defaultMessage: z.string().max(500).optional(),
  slotIntervalMinutes: z.coerce.number().int().min(5).max(240),
});

export async function saveBusinessAction(_prev: unknown, formData: FormData) {
  const session = await requireProfessional();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    contactPhone: formData.get("contactPhone"),
    defaultMessage: formData.get("defaultMessage") || undefined,
    slotIntervalMinutes: formData.get("slotIntervalMinutes"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  await updateBusinessProfile(session.businessId!, parsed.data);
  revalidatePath("/admin/business");
  return { ok: true };
}
```

- [ ] **Step 2: Route handler de upload de logo**

Create `src/app/api/logo/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { requireProfessional } from "@/lib/auth-guard";
import { LocalFileStorage } from "@/adapters/local-file-storage";
import { updateLogoUrl } from "@/services/business-service";

const storage = new LocalFileStorage();
const ALLOWED = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: Request) {
  const session = await requireProfessional();
  const form = await req.formData();
  const file = form.get("logo");

  if (!(file instanceof File) || !ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 400 });
  }
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Máx 2MB." }, { status: 400 });
  }

  const ext = file.type.split("/")[1];
  const key = `logo-${session.businessId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await storage.save(key, buffer, file.type);
  await updateLogoUrl(session.businessId!, url);

  return NextResponse.redirect(new URL("/admin/business", req.url));
}
```

- [ ] **Step 3: Página de dados do negócio**

Create `src/app/admin/business/page.tsx`:

```tsx
import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness } from "@/services/business-service";
import { BusinessForm } from "./form";

export default async function BusinessPage() {
  const session = await requireProfessional();
  const b = await getBusiness(session.businessId!);
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Dados do negócio</h1>
      <BusinessForm
        defaults={{
          name: b.name,
          contactPhone: b.contactPhone,
          defaultMessage: b.defaultMessage ?? "",
          slotIntervalMinutes: b.slotIntervalMinutes,
          logoUrl: b.logoUrl,
        }}
      />
    </main>
  );
}
```

- [ ] **Step 4: Formulário client (perfil + upload)**

Create `src/app/admin/business/form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { saveBusinessAction } from "./actions";

interface Props {
  defaults: {
    name: string;
    contactPhone: string;
    defaultMessage: string;
    slotIntervalMinutes: number;
    logoUrl: string | null;
  };
}

export function BusinessForm({ defaults }: Props) {
  const [state, action, pending] = useActionState(saveBusinessAction, null);
  return (
    <div className="space-y-8">
      <form action={action} className="space-y-4">
        <input name="name" defaultValue={defaults.name} placeholder="Nome do negócio" required className="w-full rounded border p-2" />
        <input name="contactPhone" defaultValue={defaults.contactPhone} placeholder="Telefone" required className="w-full rounded border p-2" />
        <textarea name="defaultMessage" defaultValue={defaults.defaultMessage} placeholder="Mensagem padrão" className="w-full rounded border p-2" />
        <input name="slotIntervalMinutes" type="number" defaultValue={defaults.slotIntervalMinutes} min={5} max={240} className="w-full rounded border p-2" />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state?.ok && <p className="text-sm text-green-600">Salvo.</p>}
        <button disabled={pending} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {pending ? "Salvando..." : "Salvar"}
        </button>
      </form>

      <form action="/api/logo" method="post" encType="multipart/form-data" className="space-y-3">
        {defaults.logoUrl && <img src={defaults.logoUrl} alt="logo" className="h-20 w-20 rounded object-cover" />}
        <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" required />
        <button className="rounded border px-4 py-2">Enviar logo</button>
      </form>
    </div>
  );
}
```

- [ ] **Step 5: Compilar/build e commitar**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

```bash
git add src/app/admin/business src/app/api/logo
git commit -m "feat: business profile page and logo upload"
```

---

### Task 8: Telas de serviços

**Files:**
- Create: `src/app/admin/services/page.tsx`, `src/app/admin/services/actions.ts`

- [ ] **Step 1: Actions de serviços**

Create `src/app/admin/services/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth-guard";
import {
  createService,
  updateService,
  setServiceActive,
} from "@/services/service-catalog";

const schema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().int().min(0),
  durationMinutes: z.coerce.number().int().min(5),
});

export async function createServiceAction(_prev: unknown, formData: FormData) {
  const session = await requireProfessional();
  const parsed = schema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };
  await createService(session.businessId!, parsed.data);
  revalidatePath("/admin/services");
  return { ok: true };
}

export async function updateServiceAction(formData: FormData) {
  const session = await requireProfessional();
  const id = String(formData.get("id"));
  const parsed = schema.safeParse({
    name: formData.get("name"),
    price: formData.get("price"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!parsed.success) return;
  await updateService(session.businessId!, id, parsed.data);
  revalidatePath("/admin/services");
}

export async function toggleServiceAction(formData: FormData) {
  const session = await requireProfessional();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";
  await setServiceActive(session.businessId!, id, active);
  revalidatePath("/admin/services");
}
```

- [ ] **Step 2: Página de serviços (lista + criar + editar/ativar)**

Create `src/app/admin/services/page.tsx`:

```tsx
import { requireProfessional } from "@/lib/auth-guard";
import { listServices } from "@/services/service-catalog";
import {
  createServiceAction,
  updateServiceAction,
  toggleServiceAction,
} from "./actions";

export default async function ServicesPage() {
  const session = await requireProfessional();
  const services = await listServices(session.businessId!);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-6 text-xl font-semibold">Serviços</h1>

      <form action={createServiceAction} className="mb-8 flex flex-wrap gap-2">
        <input name="name" placeholder="Nome" required className="rounded border p-2" />
        <input name="price" type="number" placeholder="Preço (R$)" required min={0} className="w-28 rounded border p-2" />
        <input name="durationMinutes" type="number" placeholder="Min" required min={5} className="w-24 rounded border p-2" />
        <button className="rounded bg-black px-4 text-white">Adicionar</button>
      </form>

      <ul className="space-y-3">
        {services.map((s) => (
          <li key={s.id} className="rounded border p-3">
            <form action={updateServiceAction} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={s.id} />
              <input name="name" defaultValue={s.name} className="rounded border p-1" />
              <input name="price" type="number" defaultValue={s.price} className="w-24 rounded border p-1" />
              <input name="durationMinutes" type="number" defaultValue={s.durationMinutes} className="w-20 rounded border p-1" />
              <button className="rounded border px-3 py-1 text-sm">Salvar</button>
            </form>
            <form action={toggleServiceAction} className="mt-2">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="active" value={(!s.active).toString()} />
              <button className="text-sm underline">
                {s.active ? "Inativar" : "Ativar"} · status atual: {s.active ? "ativo" : "inativo"}
              </button>
            </form>
          </li>
        ))}
        {services.length === 0 && <li className="text-sm text-gray-500">Nenhum serviço ainda.</li>}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Compilar/build e commitar**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

```bash
git add src/app/admin/services
git commit -m "feat: services management screens"
```

---

### Task 9: Tela de agenda + fechar dia

**Files:**
- Create: `src/app/admin/agenda/page.tsx`, `src/app/admin/agenda/actions.ts`

- [ ] **Step 1: Actions da agenda**

Create `src/app/admin/agenda/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { requireProfessional } from "@/lib/auth-guard";
import {
  closeDay,
  reopenDay,
  cancelByProfessional,
} from "@/services/agenda-service";

export async function closeDayAction(formData: FormData) {
  const session = await requireProfessional();
  await closeDay(session.businessId!, String(formData.get("date")));
  revalidatePath("/admin/agenda");
}

export async function reopenDayAction(formData: FormData) {
  const session = await requireProfessional();
  await reopenDay(session.businessId!, String(formData.get("date")));
  revalidatePath("/admin/agenda");
}

export async function cancelAppointmentAction(formData: FormData) {
  const session = await requireProfessional();
  await cancelByProfessional(session.businessId!, String(formData.get("id")));
  revalidatePath("/admin/agenda");
}
```

- [ ] **Step 2: Página de agenda por dia**

Create `src/app/admin/agenda/page.tsx`:

```tsx
import { requireProfessional } from "@/lib/auth-guard";
import { getBusiness } from "@/services/business-service";
import {
  listAppointmentsByDay,
  isDayClosed,
} from "@/services/agenda-service";
import {
  closeDayAction,
  reopenDayAction,
  cancelAppointmentAction,
} from "./actions";
import { formatInTimeZone } from "date-fns-tz";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const session = await requireProfessional();
  const business = await getBusiness(session.businessId!);
  const tz = business.timezone;
  const today = formatInTimeZone(new Date(), tz, "yyyy-MM-dd");
  const date = (await searchParams).date ?? today;

  const appointments = await listAppointmentsByDay(business.id, date, tz);
  const closed = await isDayClosed(business.id, date);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="mb-4 text-xl font-semibold">Agenda</h1>
      <form className="mb-6 flex items-center gap-2">
        <input type="date" name="date" defaultValue={date} className="rounded border p-2" />
        <button className="rounded border px-3 py-2 text-sm">Ver</button>
      </form>

      <div className="mb-4">
        {closed ? (
          <form action={reopenDayAction}>
            <input type="hidden" name="date" value={date} />
            <span className="mr-3 rounded bg-red-100 px-2 py-1 text-sm">Dia fechado</span>
            <button className="text-sm underline">Reabrir dia</button>
          </form>
        ) : (
          <form action={closeDayAction}>
            <input type="hidden" name="date" value={date} />
            <button className="text-sm underline">Fechar este dia</button>
          </form>
        )}
      </div>

      <ul className="space-y-3">
        {appointments.map((a) => (
          <li key={a.id} className="flex items-center justify-between rounded border p-3">
            <div>
              <p className="font-medium">
                {formatInTimeZone(a.startAt, tz, "HH:mm")} · {a.serviceNameSnapshot}
              </p>
              <p className="text-sm text-gray-500">
                {a.customerName} · {a.customerPhone} · R$ {a.priceSnapshot}
              </p>
            </div>
            <form action={cancelAppointmentAction}>
              <input type="hidden" name="id" value={a.id} />
              <button className="text-sm text-red-600 underline">Cancelar</button>
            </form>
          </li>
        ))}
        {appointments.length === 0 && (
          <li className="text-sm text-gray-500">Nenhum agendamento neste dia.</li>
        )}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Build, suíte completa e commit**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: tudo verde.

```bash
git add src/app/admin/agenda
git commit -m "feat: professional agenda view with close-day and cancel"
```

---

## Done quando

- Profissional loga em `/admin`, vê aviso de prontidão (regra 9.3) até completar o cadastro.
- Edita dados do negócio, horários semanais e envia logo.
- Cria/edita/ativa/inativa serviços (isolados por negócio).
- Vê agenda por dia (no fuso do negócio), fecha/reabre dia (sem cancelar existentes — regra 11.7) e cancela atendimento como profissional.
- `npm test` e `npm run build` verdes.

**Próximo:** Plano 4 — Página pública, agendamento com OTP, meus agendamentos (cancelar/remarcar).
