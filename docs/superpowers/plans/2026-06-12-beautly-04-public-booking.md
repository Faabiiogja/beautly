# Beautly MVP — Plano 4: Página Pública + Agendamento + OTP

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a página pública da profissional, o fluxo de agendamento da cliente (serviço → data → horário → nome/telefone → OTP → confirmação) e a área "Meus agendamentos" (consultar, cancelar, remarcar), com toda a regra de disponibilidade e isolamento.

**Architecture:** `AvailabilityService` combina a lógica pura do Plano 1 com dados do banco e os helpers de timezone do Plano 3. `OtpService` gera/verifica códigos atrás da porta `OtpSender`. Verificação de telefone vira uma sessão de cliente (cookie próprio). `BookingService` confirma/remarca/cancela dentro de transações. Páginas públicas Server Components + Server Actions.

**Tech Stack:** Next.js App Router, Prisma, Zod, date-fns-tz, iron-session, Vitest.

**Depende de:** Planos 1, 2 e 3 concluídos.

**Constantes (criar `src/lib/constants.ts`):** `BOOKING_WINDOW_DAYS = 15`, `OTP_TTL_MINUTES = 10`, `OTP_MAX_ATTEMPTS = 5`, `OTP_LENGTH = 6`.

---

## Estrutura de arquivos deste plano

- `src/lib/constants.ts` — constantes do MVP
- `src/lib/timezone.ts` (modificar) — `utcToLocalMinutes`, `todayLocalDateStr`, `daysBetween`
- `src/lib/client-session.ts` — sessão de telefone verificado
- `src/services/availability-service.ts` (+test)
- `src/services/otp-service.ts` (+test)
- `src/services/booking-service.ts` (+test) — confirmar/remarcar/cancelar/listar
- `src/app/[slug]/page.tsx` — página pública
- `src/app/[slug]/agendar/*` — fluxo de agendamento
- `src/app/[slug]/meus-agendamentos/*` — consulta/cancelar/remarcar
- `src/lib/otp-provider.ts` — fábrica do OtpSender (mock por enquanto)

---

### Task 1: Constantes + helpers de timezone extra (TDD)

**Files:**
- Create: `src/lib/constants.ts`
- Modify: `src/lib/timezone.ts`, `src/lib/timezone.test.ts`

- [ ] **Step 1: Constantes**

Create `src/lib/constants.ts`:

```typescript
export const BOOKING_WINDOW_DAYS = 15;
export const OTP_TTL_MINUTES = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LENGTH = 6;
```

- [ ] **Step 2: Testes que falham (anexar ao arquivo existente)**

Adicione a `src/lib/timezone.test.ts`:

```typescript
import { utcToLocalMinutes, todayLocalDateStr, daysBetween } from "./timezone";

describe("utcToLocalMinutes", () => {
  it("converts a UTC instant to minutes since local midnight", () => {
    // 2026-06-15T12:00Z == 09:00 -03:00 == 540
    expect(utcToLocalMinutes(new Date("2026-06-15T12:00:00.000Z"), "America/Sao_Paulo")).toBe(540);
  });
});

describe("daysBetween", () => {
  it("counts civil days between two YYYY-MM-DD strings", () => {
    expect(daysBetween("2026-06-15", "2026-06-20")).toBe(5);
    expect(daysBetween("2026-06-15", "2026-06-15")).toBe(0);
    expect(daysBetween("2026-06-20", "2026-06-15")).toBe(-5);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/lib/timezone.test.ts`
Expected: FAIL para as novas funções.

- [ ] **Step 4: Implementar (anexar ao timezone.ts)**

Adicione a `src/lib/timezone.ts`:

```typescript
import { formatInTimeZone } from "date-fns-tz";

/** Minutos desde a meia-noite local de um instante UTC. */
export function utcToLocalMinutes(date: Date, timeZone: string): number {
  const [h, m] = formatInTimeZone(date, timeZone, "HH:mm").split(":").map(Number);
  return h * 60 + m;
}

/** Data local atual como "YYYY-MM-DD". */
export function todayLocalDateStr(timeZone: string): string {
  return formatInTimeZone(new Date(), timeZone, "yyyy-MM-dd");
}

/** Diferença em dias civis (to - from). */
export function daysBetween(from: string, to: string): number {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  const a = Date.UTC(fy, fm - 1, fd);
  const b = Date.UTC(ty, tm - 1, td);
  return Math.round((b - a) / (24 * 60 * 60 * 1000));
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/lib/timezone.test.ts`
Expected: todos passam.

- [ ] **Step 6: Commitar**

```bash
git add src/lib/constants.ts src/lib/timezone.ts src/lib/timezone.test.ts
git commit -m "feat: booking constants and extra timezone helpers"
```

---

### Task 2: AvailabilityService (integração, TDD)

**Files:**
- Create: `src/services/availability-service.ts`, `src/services/availability-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/availability-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";
import { closeDay } from "./agenda-service";
import { availableSlots } from "./availability-service";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
  // congela "agora" antes do dia de teste para que ele esteja no futuro dentro da janela
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));

  const r = await createProfessional({
    businessName: "Maria Nails", slug: "maria-nails", contactPhone: "1",
    email: "maria@beautly.com", password: "senha123", startActive: true,
  });
  businessId = r.businessId;
  const s = await createService(businessId, { name: "Manicure", price: 30, durationMinutes: 60 });
  serviceId = s.id;
});

afterEach(() => vi.useRealTimers());

// 2026-06-15 é segunda-feira; agenda padrão 09:00-18:00, intervalo 30.
describe("availableSlots", () => {
  it("lists slots for an open weekday", async () => {
    const slots = await availableSlots(businessId, serviceId, "2026-06-15");
    // primeiro slot 09:00 -03:00 == 12:00Z
    expect(slots[0].startAt.toISOString()).toBe("2026-06-15T12:00:00.000Z");
    expect(slots[0].label).toBe("09:00");
    // último slot que cabe 60min antes das 18:00 é 17:00
    expect(slots[slots.length - 1].label).toBe("17:00");
  });

  it("returns [] for a closed day", async () => {
    await closeDay(businessId, "2026-06-15");
    expect(await availableSlots(businessId, serviceId, "2026-06-15")).toEqual([]);
  });

  it("returns [] for a Sunday (weekday not open)", async () => {
    // 2026-06-14 é domingo
    expect(await availableSlots(businessId, serviceId, "2026-06-14")).toEqual([]);
  });

  it("excludes slots overlapping a confirmed appointment", async () => {
    await prisma.appointment.create({
      data: {
        businessId, serviceId, customerName: "C", customerPhone: "11",
        startAt: new Date("2026-06-15T12:00:00.000Z"), // 09:00 local
        endAt: new Date("2026-06-15T13:00:00.000Z"),   // 10:00 local
        serviceNameSnapshot: "Manicure", priceSnapshot: 30, durationSnapshot: 60,
      },
    });
    const labels = (await availableSlots(businessId, serviceId, "2026-06-15")).map((s) => s.label);
    expect(labels).not.toContain("09:00");
    expect(labels).not.toContain("09:30");
    expect(labels).toContain("10:00");
  });

  it("returns [] beyond the 15-day window", async () => {
    // agora=2026-06-14; +20 dias está fora da janela
    expect(await availableSlots(businessId, serviceId, "2026-07-04")).toEqual([]);
  });

  it("returns [] when business is inactive", async () => {
    await prisma.business.update({ where: { id: businessId }, data: { status: "INACTIVE" } });
    expect(await availableSlots(businessId, serviceId, "2026-06-15")).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/availability-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/services/availability-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { computeAvailableSlots, type BusyInterval } from "@/domain/availability";
import {
  dayRangeUtc,
  localWeekday,
  minutesToUtc,
  utcToLocalMinutes,
  todayLocalDateStr,
  daysBetween,
} from "@/lib/timezone";
import { BOOKING_WINDOW_DAYS } from "@/lib/constants";

export interface Slot {
  startAt: Date;
  label: string;
}

function hhmmToMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function minToLabel(min: number): string {
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
}

export async function availableSlots(
  businessId: string,
  serviceId: string,
  dateStr: string,
): Promise<Slot[]> {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business || business.status !== "ACTIVE") return [];

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId, active: true },
  });
  if (!service) return [];

  const tz = business.timezone;
  const today = todayLocalDateStr(tz);
  const delta = daysBetween(today, dateStr);
  if (delta < 0 || delta > BOOKING_WINDOW_DAYS) return []; // passado ou fora da janela

  const weekday = localWeekday(dateStr, tz);
  const hours = await prisma.weeklyHours.findUnique({
    where: { businessId_weekday: { businessId, weekday } },
  });
  if (!hours || !hours.isOpen) return [];

  const closed = await prisma.dayClosure.findUnique({
    where: { businessId_date: { businessId, date: new Date(`${dateStr}T00:00:00.000Z`) } },
  });
  const isDayClosed = closed !== null;

  const { start, end } = dayRangeUtc(dateStr, tz);
  const confirmed = await prisma.appointment.findMany({
    where: { businessId, status: "CONFIRMED", startAt: { gte: start, lt: end } },
  });
  const busy: BusyInterval[] = confirmed.map((a) => ({
    startMin: utcToLocalMinutes(a.startAt, tz),
    endMin: utcToLocalMinutes(a.endAt, tz),
  }));

  // Se for hoje, descarta horários já passados; senão, do início do expediente.
  const earliestStartMin =
    delta === 0 ? utcToLocalMinutes(new Date(), tz) : 0;

  const minutes = computeAvailableSlots({
    isOpen: hours.isOpen,
    isDayClosed,
    startMin: hhmmToMin(hours.startTime),
    endMin: hhmmToMin(hours.endTime),
    interval: business.slotIntervalMinutes,
    duration: service.durationMinutes,
    busy,
    earliestStartMin,
  });

  return minutes.map((min) => ({
    startAt: minutesToUtc(dateStr, min, tz),
    label: minToLabel(min),
  }));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/availability-service.test.ts`
Expected: todos passam.

- [ ] **Step 5: Commitar**

```bash
git add src/services/availability-service.ts src/services/availability-service.test.ts
git commit -m "feat: availability service backed by domain + db"
```

---

### Task 3: OtpService (integração, TDD)

**Files:**
- Create: `src/lib/otp-provider.ts`, `src/services/otp-service.ts`, `src/services/otp-service.test.ts`

- [ ] **Step 1: Fábrica do OtpSender**

Create `src/lib/otp-provider.ts`:

```typescript
import type { OtpSender } from "@/ports/otp-sender";
import { MockOtpSender } from "@/adapters/mock-otp-sender";

// Trocar por Twilio/WhatsApp quando a integração entrar.
export const otpSender: OtpSender = new MockOtpSender();
```

- [ ] **Step 2: Teste que falha**

Create `src/services/otp-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import { sendOtp, verifyOtp } from "./otp-service";

let businessId: string;

beforeEach(async () => {
  await resetDb();
  const r = await createProfessional({
    businessName: "Maria", slug: "maria", contactPhone: "1",
    email: "maria@beautly.com", password: "senha123", startActive: true,
  });
  businessId = r.businessId;
});

describe("otp", () => {
  it("verifies the correct code and consumes it", async () => {
    const code = await sendOtp(businessId, "11999999999");
    expect(code).toMatch(/^\d{6}$/);
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(true);
    // já consumido -> segunda verificação falha
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(false);
  });

  it("rejects a wrong code", async () => {
    await sendOtp(businessId, "11999999999");
    expect(await verifyOtp(businessId, "11999999999", "000000")).toBe(false);
  });

  it("locks after too many attempts", async () => {
    const code = await sendOtp(businessId, "11999999999");
    for (let i = 0; i < 5; i++) await verifyOtp(businessId, "11999999999", "111111");
    // mesmo com o código certo, já estourou as tentativas
    expect(await verifyOtp(businessId, "11999999999", code)).toBe(false);
  });
});
```

`sendOtp` devolve o código em texto **apenas** para facilitar os testes e o adapter mock; em produção o código só vai pelo `OtpSender`.

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/services/otp-service.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar**

Create `src/services/otp-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { otpSender } from "@/lib/otp-provider";
import { OTP_TTL_MINUTES, OTP_MAX_ATTEMPTS, OTP_LENGTH } from "@/lib/constants";

function generateCode(): string {
  const max = 10 ** OTP_LENGTH;
  return String(Math.floor(Math.random() * max)).padStart(OTP_LENGTH, "0");
}

export async function sendOtp(businessId: string, phone: string): Promise<string> {
  const code = generateCode();
  await prisma.otpVerification.create({
    data: {
      businessId,
      phone,
      codeHash: await hashPassword(code),
      expiresAt: new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000),
    },
  });
  await otpSender.send(phone, code);
  return code;
}

export async function verifyOtp(
  businessId: string,
  phone: string,
  code: string,
): Promise<boolean> {
  const record = await prisma.otpVerification.findFirst({
    where: { businessId, phone, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return false;
  if (record.attempts >= OTP_MAX_ATTEMPTS) return false;

  const ok = await verifyPassword(code, record.codeHash);
  if (!ok) {
    await prisma.otpVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await prisma.otpVerification.update({
    where: { id: record.id },
    data: { consumedAt: new Date() },
  });
  return true;
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/services/otp-service.test.ts`
Expected: todos passam.

- [ ] **Step 6: Commitar**

```bash
git add src/lib/otp-provider.ts src/services/otp-service.ts src/services/otp-service.test.ts
git commit -m "feat: otp service with attempt limiting"
```

---

### Task 4: Sessão de cliente (telefone verificado)

**Files:**
- Create: `src/lib/client-session.ts`

- [ ] **Step 1: Implementar**

Create `src/lib/client-session.ts`:

```typescript
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface ClientSessionData {
  businessId?: string;
  phone?: string;
}

const options: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "beautly_client",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30, // 30 min de janela após verificar o telefone
  },
};

export async function getClientSession() {
  const cookieStore = await cookies();
  return getIronSession<ClientSessionData>(cookieStore, options);
}

/** Telefone verificado para ESTE negócio? (isolamento 18.3) */
export async function verifiedPhoneFor(businessId: string): Promise<string | null> {
  const session = await getClientSession();
  if (session.businessId === businessId && session.phone) return session.phone;
  return null;
}
```

- [ ] **Step 2: Compilar e commitar**

Run: `npx tsc --noEmit`
Expected: sem erros.

```bash
git add src/lib/client-session.ts
git commit -m "feat: client phone session"
```

---

### Task 5: BookingService — confirmar/listar/cancelar/remarcar (integração, TDD)

**Files:**
- Create: `src/services/booking-service.ts`, `src/services/booking-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/booking-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { createProfessional } from "./professional-service";
import { createService } from "./service-catalog";
import {
  confirmBooking,
  listMyAppointments,
  cancelByClient,
  rescheduleByClient,
  SlotTakenError,
} from "./booking-service";

let businessId: string;
let serviceId: string;

beforeEach(async () => {
  await resetDb();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-14T12:00:00.000Z"));
  const r = await createProfessional({
    businessName: "Maria", slug: "maria", contactPhone: "1",
    email: "maria@beautly.com", password: "senha123", startActive: true,
  });
  businessId = r.businessId;
  const s = await createService(businessId, { name: "Manicure", price: 30, durationMinutes: 60 });
  serviceId = s.id;
});

afterEach(() => vi.useRealTimers());

describe("confirmBooking", () => {
  it("creates a confirmed appointment with snapshots", async () => {
    const appt = await confirmBooking({
      businessId, serviceId, customerName: "Joana", customerPhone: "11999999999",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(appt.status).toBe("CONFIRMED");
    expect(appt.priceSnapshot).toBe(30);
    expect(appt.durationSnapshot).toBe(60);
    expect(appt.serviceNameSnapshot).toBe("Manicure");
    expect(appt.endAt.toISOString()).toBe("2026-06-15T13:00:00.000Z");
  });

  it("rejects a slot that overlaps an existing appointment", async () => {
    await confirmBooking({
      businessId, serviceId, customerName: "Joana", customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    await expect(
      confirmBooking({
        businessId, serviceId, customerName: "Bia", customerPhone: "222",
        startAt: new Date("2026-06-15T12:30:00.000Z"), // sobrepõe
      }),
    ).rejects.toBeInstanceOf(SlotTakenError);
  });
});

describe("listMyAppointments / cancel", () => {
  it("lists by phone within the business and cancels", async () => {
    const appt = await confirmBooking({
      businessId, serviceId, customerName: "Joana", customerPhone: "11999999999",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    const mine = await listMyAppointments(businessId, "11999999999");
    expect(mine).toHaveLength(1);

    await cancelByClient(businessId, "11999999999", appt.id);
    const updated = await prisma.appointment.findUniqueOrThrow({ where: { id: appt.id } });
    expect(updated.status).toBe("CANCELED_BY_CLIENT");

    // o horário volta a ficar livre
    const reuse = await confirmBooking({
      businessId, serviceId, customerName: "Bia", customerPhone: "222",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    expect(reuse.status).toBe("CONFIRMED");
  });

  it("does not cancel an appointment from a different phone", async () => {
    const appt = await confirmBooking({
      businessId, serviceId, customerName: "Joana", customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    await expect(cancelByClient(businessId, "999", appt.id)).rejects.toThrow();
  });
});

describe("rescheduleByClient", () => {
  it("marks old RESCHEDULED and creates a new CONFIRMED linked", async () => {
    const old = await confirmBooking({
      businessId, serviceId, customerName: "Joana", customerPhone: "111",
      startAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    const created = await rescheduleByClient(
      businessId, "111", old.id, new Date("2026-06-15T15:00:00.000Z"),
    );
    expect(created.status).toBe("CONFIRMED");
    expect(created.rescheduledFromId).toBe(old.id);
    const oldUpdated = await prisma.appointment.findUniqueOrThrow({ where: { id: old.id } });
    expect(oldUpdated.status).toBe("RESCHEDULED");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/booking-service.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

Create `src/services/booking-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import type { Prisma, PrismaClient } from "@prisma/client";

export class SlotTakenError extends Error {
  constructor() {
    super("Horário não está mais disponível.");
    this.name = "SlotTakenError";
  }
}

type Tx = Prisma.TransactionClient | PrismaClient;

async function assertSlotFree(tx: Tx, businessId: string, startAt: Date, endAt: Date) {
  const clash = await tx.appointment.findFirst({
    where: {
      businessId,
      status: "CONFIRMED",
      startAt: { lt: endAt },
      endAt: { gt: startAt },
    },
  });
  if (clash) throw new SlotTakenError();
}

export interface ConfirmInput {
  businessId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string;
  startAt: Date;
}

export async function confirmBooking(input: ConfirmInput) {
  return prisma.$transaction(async (tx) => {
    const business = await tx.business.findUnique({ where: { id: input.businessId } });
    if (!business || business.status !== "ACTIVE") {
      throw new Error("Negócio indisponível.");
    }
    const service = await tx.service.findFirst({
      where: { id: input.serviceId, businessId: input.businessId, active: true },
    });
    if (!service) throw new Error("Serviço indisponível.");

    const endAt = new Date(input.startAt.getTime() + service.durationMinutes * 60 * 1000);
    await assertSlotFree(tx, input.businessId, input.startAt, endAt);

    return tx.appointment.create({
      data: {
        businessId: input.businessId,
        serviceId: service.id,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        startAt: input.startAt,
        endAt,
        status: "CONFIRMED",
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationSnapshot: service.durationMinutes,
      },
    });
  });
}

export function listMyAppointments(businessId: string, phone: string) {
  return prisma.appointment.findMany({
    where: { businessId, customerPhone: phone },
    orderBy: { startAt: "desc" },
    include: { service: true },
  });
}

export async function cancelByClient(businessId: string, phone: string, appointmentId: string) {
  const result = await prisma.appointment.updateMany({
    where: { id: appointmentId, businessId, customerPhone: phone, status: "CONFIRMED" },
    data: { status: "CANCELED_BY_CLIENT" },
  });
  if (result.count === 0) throw new Error("Agendamento não encontrado.");
}

export async function rescheduleByClient(
  businessId: string,
  phone: string,
  appointmentId: string,
  newStartAt: Date,
) {
  return prisma.$transaction(async (tx) => {
    const old = await tx.appointment.findFirst({
      where: { id: appointmentId, businessId, customerPhone: phone, status: "CONFIRMED" },
    });
    if (!old) throw new Error("Agendamento não encontrado.");

    const service = await tx.service.findFirstOrThrow({
      where: { id: old.serviceId, businessId, active: true },
    });
    const endAt = new Date(newStartAt.getTime() + service.durationMinutes * 60 * 1000);
    await assertSlotFree(tx, businessId, newStartAt, endAt);

    await tx.appointment.update({
      where: { id: old.id },
      data: { status: "RESCHEDULED" },
    });

    return tx.appointment.create({
      data: {
        businessId,
        serviceId: service.id,
        customerName: old.customerName,
        customerPhone: phone,
        startAt: newStartAt,
        endAt,
        status: "CONFIRMED",
        serviceNameSnapshot: service.name,
        priceSnapshot: service.price,
        durationSnapshot: service.durationMinutes,
        rescheduledFromId: old.id,
      },
    });
  });
}
```

Nota MVP: a checagem de conflito acontece dentro da transação; sob altíssima concorrência exata no mesmo slot ainda há uma janela mínima. Endereçar com constraint/lock fica para pós-MVP (fora do escopo, seção 8 do spec).

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/booking-service.test.ts`
Expected: todos passam.

- [ ] **Step 5: Rodar a suíte inteira**

Run: `npm test`
Expected: tudo verde.

- [ ] **Step 6: Commitar**

```bash
git add src/services/booking-service.ts src/services/booking-service.test.ts
git commit -m "feat: booking service (confirm/list/cancel/reschedule)"
```

---

### Task 6: Página pública da profissional

**Files:**
- Create: `src/app/[slug]/page.tsx`
- Create: `src/repositories/business-repository.ts` (busca por slug)

- [ ] **Step 1: Repositório por slug**

Create `src/repositories/business-repository.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export function findBusinessBySlug(slug: string) {
  return prisma.business.findUnique({ where: { slug } });
}
```

- [ ] **Step 2: Página pública**

Create `src/app/[slug]/page.tsx`:

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { listActiveServices } from "@/services/service-catalog";

export default async function PublicBusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBusinessBySlug(slug);
  if (!business) notFound();

  if (business.status !== "ACTIVE") {
    return (
      <main className="mx-auto max-w-md p-8 text-center">
        <h1 className="text-xl font-semibold">{business.name}</h1>
        <p className="mt-4 rounded bg-gray-100 p-4 text-sm">
          Os agendamentos não estão disponíveis no momento.
        </p>
      </main>
    );
  }

  const services = await listActiveServices(business.id);

  return (
    <main className="mx-auto max-w-md p-8">
      <header className="mb-6 flex items-center gap-3">
        {business.logoUrl && (
          <img src={business.logoUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
        )}
        <div>
          <h1 className="text-xl font-semibold">{business.name}</h1>
          <p className="text-sm text-gray-500">{business.contactPhone}</p>
        </div>
      </header>

      {business.defaultMessage && (
        <p className="mb-6 rounded bg-gray-50 p-3 text-sm">{business.defaultMessage}</p>
      )}

      {services.length === 0 ? (
        <p className="rounded bg-gray-100 p-4 text-sm">
          Não há serviços disponíveis no momento.
        </p>
      ) : (
        <>
          <h2 className="mb-3 font-medium">Serviços</h2>
          <ul className="space-y-2">
            {services.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/${slug}/agendar?serviceId=${s.id}`}
                  className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
                >
                  <span>{s.name}</span>
                  <span className="text-sm text-gray-500">
                    R$ {s.price} · {s.durationMinutes}min
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <Link href={`/${slug}/meus-agendamentos`} className="mt-8 block text-center text-sm underline">
        Meus agendamentos
      </Link>
    </main>
  );
}
```

- [ ] **Step 3: Build e commit**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

```bash
git add src/app/[slug]/page.tsx src/repositories/business-repository.ts
git commit -m "feat: public business page"
```

---

### Task 7: Fluxo de agendamento (data → horário → OTP → confirmar)

**Files:**
- Create: `src/app/[slug]/agendar/page.tsx` — escolhe data/horário + dados
- Create: `src/app/[slug]/agendar/actions.ts` — enviar OTP / confirmar
- Create: `src/app/[slug]/agendar/confirmado/page.tsx` — confirmação visual

O fluxo usa uma única página com etapas controladas por query string para manter simplicidade: `?serviceId=...&date=...` mostra slots; ao escolher horário e preencher nome/telefone, dispara OTP; ao verificar, confirma.

- [ ] **Step 1: Actions do agendamento**

Create `src/app/[slug]/agendar/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { sendOtp, verifyOtp } from "@/services/otp-service";
import { confirmBooking, SlotTakenError } from "@/services/booking-service";
import { getClientSession } from "@/lib/client-session";

const sendSchema = z.object({
  slug: z.string(),
  phone: z.string().min(8),
});

export async function sendCodeAction(_prev: unknown, formData: FormData) {
  const parsed = sendSchema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
  });
  if (!parsed.success) return { error: "Telefone inválido." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") return { error: "Indisponível." };

  await sendOtp(business.id, parsed.data.phone);
  return { sent: true };
}

const confirmSchema = z.object({
  slug: z.string(),
  serviceId: z.string(),
  startAt: z.string(),
  customerName: z.string().min(1),
  phone: z.string().min(8),
  code: z.string().min(4),
});

export async function confirmAction(_prev: unknown, formData: FormData) {
  const parsed = confirmSchema.safeParse({
    slug: formData.get("slug"),
    serviceId: formData.get("serviceId"),
    startAt: formData.get("startAt"),
    customerName: formData.get("customerName"),
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Preencha todos os campos." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business || business.status !== "ACTIVE") return { error: "Indisponível." };

  const ok = await verifyOtp(business.id, parsed.data.phone, parsed.data.code);
  if (!ok) return { error: "Código inválido ou expirado." };

  // marca o telefone como verificado para este negócio (reuso em meus-agendamentos)
  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = parsed.data.phone;
  await session.save();

  try {
    await confirmBooking({
      businessId: business.id,
      serviceId: parsed.data.serviceId,
      customerName: parsed.data.customerName,
      customerPhone: parsed.data.phone,
      startAt: new Date(parsed.data.startAt),
    });
  } catch (e) {
    if (e instanceof SlotTakenError) return { error: e.message };
    return { error: "Não foi possível confirmar." };
  }

  redirect(`/${parsed.data.slug}/agendar/confirmado?startAt=${encodeURIComponent(parsed.data.startAt)}&serviceId=${parsed.data.serviceId}`);
}
```

- [ ] **Step 2: Página do fluxo (server + form client)**

Create `src/app/[slug]/agendar/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { availableSlots } from "@/services/availability-service";
import { todayLocalDateStr } from "@/lib/timezone";
import { prisma } from "@/lib/prisma";
import { BookingForm } from "./booking-form";

export default async function AgendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ serviceId?: string; date?: string }>;
}) {
  const { slug } = await params;
  const { serviceId, date } = await searchParams;
  const business = await findBusinessBySlug(slug);
  if (!business || business.status !== "ACTIVE" || !serviceId) notFound();

  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, active: true },
  });
  if (!service) notFound();

  const selectedDate = date ?? todayLocalDateStr(business.timezone);
  const slots = await availableSlots(business.id, serviceId, selectedDate);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-1 text-xl font-semibold">{service.name}</h1>
      <p className="mb-6 text-sm text-gray-500">R$ {service.price} · {service.durationMinutes}min</p>

      <BookingForm
        slug={slug}
        serviceId={serviceId}
        selectedDate={selectedDate}
        slots={slots.map((s) => ({ iso: s.startAt.toISOString(), label: s.label }))}
      />
    </main>
  );
}
```

- [ ] **Step 3: Formulário client (data, slot, dados, OTP)**

Create `src/app/[slug]/agendar/booking-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { sendCodeAction, confirmAction } from "./actions";

interface Props {
  slug: string;
  serviceId: string;
  selectedDate: string;
  slots: { iso: string; label: string }[];
}

export function BookingForm({ slug, serviceId, selectedDate, slots }: Props) {
  const router = useRouter();
  const [chosen, setChosen] = useState<string | null>(null);
  const [sendState, sendAction, sending] = useActionState(sendCodeAction, null);
  const [confirmState, confirmFormAction, confirming] = useActionState(confirmAction, null);

  return (
    <div className="space-y-6">
      <div>
        <label className="mb-1 block text-sm">Data</label>
        <input
          type="date"
          defaultValue={selectedDate}
          onChange={(e) =>
            router.push(`/${slug}/agendar?serviceId=${serviceId}&date=${e.target.value}`)
          }
          className="w-full rounded border p-2"
        />
      </div>

      <div>
        <p className="mb-2 text-sm">Horários</p>
        {slots.length === 0 ? (
          <p className="rounded bg-gray-100 p-3 text-sm">
            Não há horários disponíveis para este serviço no momento.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {slots.map((s) => (
              <button
                key={s.iso}
                onClick={() => setChosen(s.iso)}
                className={`rounded border px-3 py-1 text-sm ${chosen === s.iso ? "bg-black text-white" : ""}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {chosen && (
        <form action={confirmFormAction} className="space-y-3 border-t pt-4">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="serviceId" value={serviceId} />
          <input type="hidden" name="startAt" value={chosen} />
          <input name="customerName" placeholder="Seu nome" required className="w-full rounded border p-2" />
          <input name="phone" id="phone" placeholder="Seu telefone" required className="w-full rounded border p-2" />

          <button
            type="button"
            disabled={sending}
            onClick={() => {
              const phone = (document.getElementById("phone") as HTMLInputElement)?.value;
              const fd = new FormData();
              fd.set("slug", slug);
              fd.set("phone", phone);
              sendAction(fd);
            }}
            className="w-full rounded border p-2 text-sm disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar código de confirmação"}
          </button>
          {sendState?.error && <p className="text-sm text-red-600">{sendState.error}</p>}
          {sendState?.sent && <p className="text-sm text-green-600">Código enviado. Verifique seu telefone.</p>}

          <input name="code" placeholder="Código recebido" className="w-full rounded border p-2" />
          {confirmState?.error && <p className="text-sm text-red-600">{confirmState.error}</p>}
          <button type="submit" disabled={confirming} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
            {confirming ? "Confirmando..." : "Confirmar agendamento"}
          </button>
        </form>
      )}
    </div>
  );
}
```

Observação: `sendAction` é a action vinculada do `useActionState`; chamá-la com um `FormData` montado na mão dispara o envio do OTP sem submeter o formulário principal.

- [ ] **Step 4: Página de confirmação visual**

Create `src/app/[slug]/agendar/confirmado/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { prisma } from "@/lib/prisma";
import { formatInTimeZone } from "date-fns-tz";
import Link from "next/link";

export default async function ConfirmadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ startAt?: string; serviceId?: string }>;
}) {
  const { slug } = await params;
  const { startAt, serviceId } = await searchParams;
  const business = await findBusinessBySlug(slug);
  if (!business || !startAt || !serviceId) notFound();

  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  const when = formatInTimeZone(new Date(startAt), business.timezone, "dd/MM/yyyy 'às' HH:mm");

  return (
    <main className="mx-auto max-w-md p-8 text-center">
      <h1 className="mb-4 text-xl font-semibold text-green-700">Agendamento confirmado!</h1>
      <div className="rounded border p-4 text-left">
        <p><strong>Serviço:</strong> {service?.name}</p>
        <p><strong>Data e hora:</strong> {when}</p>
        <p><strong>Profissional:</strong> {business.name}</p>
        {business.defaultMessage && <p className="mt-2 text-sm text-gray-600">{business.defaultMessage}</p>}
      </div>
      <Link href={`/${slug}/meus-agendamentos`} className="mt-6 block text-sm underline">
        Ver meus agendamentos
      </Link>
    </main>
  );
}
```

- [ ] **Step 5: Build e commit**

Run: `npx tsc --noEmit && npm run build`
Expected: sem erros.

```bash
git add src/app/[slug]/agendar
git commit -m "feat: booking flow with otp and confirmation"
```

---

### Task 8: Meus agendamentos (consultar, cancelar, remarcar)

**Files:**
- Create: `src/app/[slug]/meus-agendamentos/page.tsx`, `actions.ts`
- Create: `src/app/[slug]/meus-agendamentos/list.tsx`

- [ ] **Step 1: Actions**

Create `src/app/[slug]/meus-agendamentos/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { sendOtp, verifyOtp } from "@/services/otp-service";
import { getClientSession } from "@/lib/client-session";
import { cancelByClient, rescheduleByClient, SlotTakenError } from "@/services/booking-service";
import { revalidatePath } from "next/cache";

export async function requestAccessAction(_prev: unknown, formData: FormData) {
  const slug = String(formData.get("slug"));
  const phone = String(formData.get("phone"));
  const business = await findBusinessBySlug(slug);
  if (!business) return { error: "Indisponível." };
  await sendOtp(business.id, phone);
  return { sent: true };
}

export async function verifyAccessAction(_prev: unknown, formData: FormData) {
  const schema = z.object({ slug: z.string(), phone: z.string().min(8), code: z.string().min(4) });
  const parsed = schema.safeParse({
    slug: formData.get("slug"),
    phone: formData.get("phone"),
    code: formData.get("code"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const business = await findBusinessBySlug(parsed.data.slug);
  if (!business) return { error: "Indisponível." };

  const ok = await verifyOtp(business.id, parsed.data.phone, parsed.data.code);
  if (!ok) return { error: "Código inválido ou expirado." };

  const session = await getClientSession();
  session.businessId = business.id;
  session.phone = parsed.data.phone;
  await session.save();
  revalidatePath(`/${parsed.data.slug}/meus-agendamentos`);
  return { ok: true };
}

export async function cancelAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const business = await findBusinessBySlug(slug);
  if (!business) return;
  const session = await getClientSession();
  if (session.businessId !== business.id || !session.phone) return;
  await cancelByClient(business.id, session.phone, String(formData.get("id")));
  revalidatePath(`/${slug}/meus-agendamentos`);
}

export async function rescheduleAction(_prev: unknown, formData: FormData) {
  const slug = String(formData.get("slug"));
  const business = await findBusinessBySlug(slug);
  if (!business) return { error: "Indisponível." };
  const session = await getClientSession();
  if (session.businessId !== business.id || !session.phone) return { error: "Sessão expirada." };

  try {
    await rescheduleByClient(
      business.id,
      session.phone,
      String(formData.get("id")),
      new Date(String(formData.get("startAt"))),
    );
  } catch (e) {
    if (e instanceof SlotTakenError) return { error: e.message };
    return { error: "Não foi possível remarcar." };
  }
  revalidatePath(`/${slug}/meus-agendamentos`);
  return { ok: true };
}
```

- [ ] **Step 2: Página (pede telefone+OTP; depois lista)**

Create `src/app/[slug]/meus-agendamentos/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { findBusinessBySlug } from "@/repositories/business-repository";
import { verifiedPhoneFor } from "@/lib/client-session";
import { listMyAppointments } from "@/services/booking-service";
import { AccessForm } from "./access-form";
import { AppointmentsList } from "./list";

export default async function MyAppointmentsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBusinessBySlug(slug);
  if (!business) notFound();

  const phone = await verifiedPhoneFor(business.id);
  if (!phone) {
    return (
      <main className="mx-auto max-w-md p-8">
        <h1 className="mb-6 text-xl font-semibold">Meus agendamentos</h1>
        <AccessForm slug={slug} />
      </main>
    );
  }

  const appointments = await listMyAppointments(business.id, phone);
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Meus agendamentos</h1>
      <AppointmentsList
        slug={slug}
        timezone={business.timezone}
        appointments={appointments.map((a) => ({
          id: a.id,
          status: a.status,
          serviceName: a.serviceNameSnapshot,
          serviceId: a.serviceId,
          startAt: a.startAt.toISOString(),
          price: a.priceSnapshot,
        }))}
      />
    </main>
  );
}
```

- [ ] **Step 3: Formulário de acesso (telefone + OTP)**

Create `src/app/[slug]/meus-agendamentos/access-form.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { requestAccessAction, verifyAccessAction } from "./actions";

export function AccessForm({ slug }: { slug: string }) {
  const [reqState, reqAction, requesting] = useActionState(requestAccessAction, null);
  const [verState, verAction, verifying] = useActionState(verifyAccessAction, null);

  return (
    <div className="space-y-4">
      <form action={reqAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <input name="phone" placeholder="Seu telefone" required className="w-full rounded border p-2" />
        <button disabled={requesting} className="w-full rounded border p-2 text-sm disabled:opacity-50">
          {requesting ? "Enviando..." : "Receber código"}
        </button>
        {reqState?.error && <p className="text-sm text-red-600">{reqState.error}</p>}
        {reqState?.sent && <p className="text-sm text-green-600">Código enviado.</p>}
      </form>

      <form action={verAction} className="space-y-3">
        <input type="hidden" name="slug" value={slug} />
        <input name="phone" placeholder="Confirme o telefone" required className="w-full rounded border p-2" />
        <input name="code" placeholder="Código" required className="w-full rounded border p-2" />
        <button disabled={verifying} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {verifying ? "Verificando..." : "Acessar"}
        </button>
        {verState?.error && <p className="text-sm text-red-600">{verState.error}</p>}
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Lista com cancelar/remarcar**

Create `src/app/[slug]/meus-agendamentos/list.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useActionState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { cancelAction, rescheduleAction } from "./actions";

interface Appt {
  id: string;
  status: string;
  serviceName: string;
  serviceId: string;
  startAt: string;
  price: number;
}

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmado",
  CANCELED_BY_CLIENT: "Cancelado por você",
  CANCELED_BY_PROFESSIONAL: "Cancelado pela profissional",
  RESCHEDULED: "Reagendado",
};

export function AppointmentsList({
  slug,
  timezone,
  appointments,
}: {
  slug: string;
  timezone: string;
  appointments: Appt[];
}) {
  const [reState, reAction, repending] = useActionState(rescheduleAction, null);
  const [openId, setOpenId] = useState<string | null>(null);

  if (appointments.length === 0) {
    return <p className="text-sm text-gray-500">Você ainda não tem agendamentos.</p>;
  }

  return (
    <ul className="space-y-3">
      {appointments.map((a) => (
        <li key={a.id} className="rounded border p-3">
          <p className="font-medium">{a.serviceName}</p>
          <p className="text-sm text-gray-500">
            {formatInTimeZone(new Date(a.startAt), timezone, "dd/MM/yyyy 'às' HH:mm")} · R$ {a.price}
          </p>
          <p className="mt-1 text-xs">{STATUS_LABEL[a.status] ?? a.status}</p>

          {a.status === "CONFIRMED" && (
            <div className="mt-2 flex flex-col gap-2">
              <form action={cancelAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="id" value={a.id} />
                <button className="text-sm text-red-600 underline">Cancelar</button>
              </form>

              <button onClick={() => setOpenId(openId === a.id ? null : a.id)} className="text-left text-sm underline">
                Remarcar
              </button>

              {openId === a.id && (
                <form action={reAction} className="flex items-center gap-2">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="id" value={a.id} />
                  {/* novo horário em ISO; em produção, integrar o seletor de slots da página de agendar */}
                  <input type="datetime-local" name="startAtLocal" className="rounded border p-1" disabled />
                  <input
                    type="hidden"
                    name="startAt"
                    value={new Date(a.startAt).toISOString()}
                  />
                  <span className="text-xs text-gray-500">
                    Escolha um novo horário pela página do serviço e confirme.
                  </span>
                </form>
              )}
            </div>
          )}
        </li>
      ))}
      {reState?.error && <p className="text-sm text-red-600">{reState.error}</p>}
    </ul>
  );
}
```

> **Nota de implementação para o executor:** o seletor de novo horário da remarcação deve reusar o componente de slots da Task 7 (`availableSlots` + botões), passando o `serviceId` do agendamento e enviando o `startAt` ISO escolhido para `rescheduleAction`. O bloco acima deixa o gancho pronto; conecte o seletor real de slots em vez do campo desabilitado antes de finalizar.

- [ ] **Step 5: Build, suíte e commit**

Run: `npx tsc --noEmit && npm run build && npm test`
Expected: tudo verde.

```bash
git add src/app/[slug]/meus-agendamentos
git commit -m "feat: my-appointments with cancel and reschedule"
```

---

## Done quando (critérios de aceite do MVP, seção 28 do negócio)

- Cliente acessa `/<slug>`, vê serviços ativos (ou mensagens de indisponível — regras 19.3/19.4).
- Negócio inativo bloqueia novos agendamentos (regra 9.2).
- Cliente escolhe data/horário disponível (respeitando conflito, duração, dia fechado, janela de 15 dias e horário passado).
- Cliente informa nome+telefone, verifica por OTP e confirma; vê confirmação visual.
- Cliente consulta seus agendamentos (telefone verificado), cancela e remarca; horário liberado/ocupado corretamente.
- Serviço inativo e dia fechado não aparecem para novos agendamentos.
- `npm test` e `npm run build` verdes.

**Fim do MVP.** Antes de produção, troque os adapters de dev (`MockOtpSender`, `LocalFileStorage`) pelas integrações reais e conclua o gancho de remarcação (nota da Task 8).
