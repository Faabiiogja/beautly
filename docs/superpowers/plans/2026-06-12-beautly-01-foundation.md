# Beautly MVP — Plano 1: Fundação + Domínio

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Montar o projeto Next.js + Prisma + Vitest, definir o schema completo do banco e implementar (via TDD) a lógica pura de disponibilidade/conflito e as portas de OTP e armazenamento de arquivos.

**Architecture:** Monolito Next.js (App Router). Lógica de domínio pura (sem DB, baseada em minutos a partir da meia-noite) isolada em `src/domain`. Portas (`src/ports`) com adapters de dev (`src/adapters`). Acesso a dados via Prisma. Conversão de timezone fica na camada de serviço (planos posteriores).

**Tech Stack:** Next.js 15, React 19, TypeScript, Prisma 6 + PostgreSQL, Vitest 3, Zod 3.

**Pré-requisito:** PostgreSQL acessível (local ou Docker). O executor deve ter uma `DATABASE_URL` válida.

---

## Estrutura de arquivos deste plano

- `package.json`, `tsconfig.json`, `next.config.ts` — scaffold (Task 1)
- `vitest.config.ts`, `src/test/setup.ts` — testes (Task 2)
- `prisma/schema.prisma`, `.env`, `.env.example` — schema (Task 3)
- `src/domain/interval.ts` + `src/domain/interval.test.ts` — overlap (Task 4)
- `src/domain/slots.ts` + `src/domain/slots.test.ts` — candidatos (Task 5)
- `src/domain/availability.ts` + `src/domain/availability.test.ts` — composição (Task 6)
- `src/ports/otp-sender.ts`, `src/ports/file-storage.ts` — interfaces (Task 7)
- `src/adapters/mock-otp-sender.ts` (+test), `src/adapters/local-file-storage.ts` (+test) (Task 7)
- `src/lib/prisma.ts` — singleton Prisma (Task 8)

---

### Task 1: Inicializar projeto Next.js + git

**Files:**
- Create: projeto Next.js na raiz `/home/fabio/Job/Projects/Beauty`

- [ ] **Step 1: Criar o app Next.js na raiz**

O diretório já contém `.claude/` e `docs/`. Crie o app no diretório atual aceitando os defaults abaixo.

```bash
cd /home/fabio/Job/Projects/Beauty
npx create-next-app@latest . \
  --typescript --eslint --app --src-dir \
  --tailwind --import-alias "@/*" --no-turbopack --yes
```

Se o comando reclamar de diretório não vazio, mova `docs/` e `.claude/` temporariamente, rode o create, e devolva-os — ou crie em subpasta e copie. O resultado esperado é `package.json`, `tsconfig.json`, `next.config.ts`, `src/app/` presentes na raiz.

- [ ] **Step 2: Inicializar git e primeiro commit**

```bash
cd /home/fabio/Job/Projects/Beauty
git init
git add -A
git commit -m "chore: scaffold Next.js app"
```

Expected: commit criado sem erro.

- [ ] **Step 3: Verificar build/lint mínimos**

Run: `npm run lint`
Expected: passa sem erros (warnings são aceitáveis).

---

### Task 2: Configurar Vitest

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json` (script `test`)

- [ ] **Step 1: Instalar dependências de teste**

```bash
npm install -D vitest @vitest/coverage-v8
```

- [ ] **Step 2: Criar `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 3: Adicionar script de teste**

Em `package.json`, dentro de `"scripts"`, adicione:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Criar um teste-sentinela**

Create `src/domain/sanity.test.ts`:

```typescript
import { describe, it, expect } from "vitest";

describe("sanity", () => {
  it("runs vitest", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Rodar testes**

Run: `npm test`
Expected: 1 passed.

- [ ] **Step 6: Remover o sentinela e commitar**

```bash
rm src/domain/sanity.test.ts
git add -A
git commit -m "chore: add vitest"
```

---

### Task 3: Prisma + schema completo

**Files:**
- Create: `prisma/schema.prisma`, `.env`, `.env.example`
- Modify: `.gitignore` (garantir `.env` ignorado)

- [ ] **Step 1: Instalar Prisma**

```bash
npm install -D prisma
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Definir `.env` e `.env.example`**

`.env` (não commitar — ajuste a URL ao seu Postgres):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beautly?schema=public"
```

`.env.example` (commitar):

```
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/beautly?schema=public"
```

Confirme que `.gitignore` contém `.env`.

- [ ] **Step 3: Escrever o schema completo**

Substitua o conteúdo de `prisma/schema.prisma` por:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  PLATFORM_ADMIN
  PROFESSIONAL
}

enum BusinessStatus {
  ACTIVE
  INACTIVE
}

enum AppointmentStatus {
  CONFIRMED
  CANCELED_BY_CLIENT
  CANCELED_BY_PROFESSIONAL
  RESCHEDULED
}

model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  role         Role
  businessId   String?
  business     Business? @relation(fields: [businessId], references: [id])
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Business {
  id                  String         @id @default(cuid())
  slug                String         @unique
  name                String
  contactPhone        String
  defaultMessage      String?
  logoUrl             String?
  timezone            String         @default("America/Sao_Paulo")
  slotIntervalMinutes Int            @default(30)
  status              BusinessStatus @default(ACTIVE)
  createdAt           DateTime       @default(now())
  updatedAt           DateTime       @updatedAt

  users        User[]
  services     Service[]
  weeklyHours  WeeklyHours[]
  dayClosures  DayClosure[]
  appointments Appointment[]
}

model Service {
  id              String   @id @default(cuid())
  businessId      String
  business        Business @relation(fields: [businessId], references: [id])
  name            String
  price           Int
  durationMinutes Int
  active          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  appointments Appointment[]

  @@index([businessId])
}

model WeeklyHours {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  weekday    Int
  isOpen     Boolean  @default(false)
  startTime  String
  endTime    String

  @@unique([businessId, weekday])
}

model DayClosure {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  date       DateTime @db.Date

  @@unique([businessId, date])
  @@index([businessId])
}

model Appointment {
  id                  String            @id @default(cuid())
  businessId          String
  business            Business          @relation(fields: [businessId], references: [id])
  serviceId           String
  service             Service           @relation(fields: [serviceId], references: [id])
  customerName        String
  customerPhone       String
  startAt             DateTime
  endAt               DateTime
  status              AppointmentStatus @default(CONFIRMED)
  serviceNameSnapshot String
  priceSnapshot       Int
  durationSnapshot    Int
  rescheduledFromId   String?           @unique
  rescheduledFrom     Appointment?      @relation("Reschedule", fields: [rescheduledFromId], references: [id])
  rescheduledTo       Appointment?      @relation("Reschedule")
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  @@index([businessId, startAt])
  @@index([businessId, customerPhone])
}

model OtpVerification {
  id         String    @id @default(cuid())
  businessId String
  phone      String
  codeHash   String
  expiresAt  DateTime
  attempts   Int       @default(0)
  consumedAt DateTime?
  createdAt  DateTime  @default(now())

  @@index([businessId, phone])
}
```

`startTime`/`endTime` em `WeeklyHours` são strings `"HH:MM"` (a conversão para minutos acontece na camada de serviço).

- [ ] **Step 4: Criar e aplicar a migration**

Run: `npx prisma migrate dev --name init`
Expected: migration aplicada, client gerado, sem erros.

- [ ] **Step 5: Commitar**

```bash
git add -A
git commit -m "feat: prisma schema and initial migration"
```

---

### Task 4: Domínio — sobreposição de intervalos (TDD)

**Files:**
- Create: `src/domain/interval.ts`
- Test: `src/domain/interval.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/domain/interval.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { overlaps } from "./interval";

describe("overlaps", () => {
  it("returns true when ranges partially overlap", () => {
    // [60,120) vs [90,150) -> overlap
    expect(overlaps(60, 120, 90, 150)).toBe(true);
  });

  it("returns false when ranges only touch at the boundary", () => {
    // [60,120) vs [120,180) -> no overlap (end is exclusive)
    expect(overlaps(60, 120, 120, 180)).toBe(false);
  });

  it("returns false when ranges are disjoint", () => {
    expect(overlaps(60, 120, 200, 260)).toBe(false);
  });

  it("returns true when one range contains the other", () => {
    expect(overlaps(60, 240, 90, 150)).toBe(true);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/domain/interval.test.ts`
Expected: FAIL — `overlaps` não existe.

- [ ] **Step 3: Implementar**

Create `src/domain/interval.ts`:

```typescript
/**
 * Intervalos meio-abertos [start, end). Encostar na borda não conta como
 * sobreposição: um serviço que termina às 120 não conflita com outro que começa em 120.
 */
export function overlaps(
  aStart: number,
  aEnd: number,
  bStart: number,
  bEnd: number,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/domain/interval.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commitar**

```bash
git add src/domain/interval.ts src/domain/interval.test.ts
git commit -m "feat: interval overlap helper"
```

---

### Task 5: Domínio — gerar horários candidatos (TDD)

**Files:**
- Create: `src/domain/slots.ts`
- Test: `src/domain/slots.test.ts`

Todos os valores são **minutos a partir da meia-noite** (ex: 9h = 540).

- [ ] **Step 1: Escrever o teste que falha**

Create `src/domain/slots.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { generateCandidates } from "./slots";

describe("generateCandidates", () => {
  it("generates start times every interval that fit before end", () => {
    // 9h-11h (540-660), intervalo 30, duração 30 -> 540,570,600,630
    expect(
      generateCandidates({ startMin: 540, endMin: 660, interval: 30, duration: 30 }),
    ).toEqual([540, 570, 600, 630]);
  });

  it("excludes candidates whose service would run past end", () => {
    // 9h-11h (540-660), intervalo 30, duração 60 -> 540,570,600 (630+60=690>660 fora)
    expect(
      generateCandidates({ startMin: 540, endMin: 660, interval: 30, duration: 60 }),
    ).toEqual([540, 570, 600]);
  });

  it("returns empty when the service does not fit at all", () => {
    expect(
      generateCandidates({ startMin: 540, endMin: 560, interval: 30, duration: 60 }),
    ).toEqual([]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/domain/slots.test.ts`
Expected: FAIL — `generateCandidates` não existe.

- [ ] **Step 3: Implementar**

Create `src/domain/slots.ts`:

```typescript
export interface GenerateCandidatesInput {
  startMin: number;
  endMin: number;
  interval: number;
  duration: number;
}

/**
 * Horários de início (em minutos da meia-noite) a cada `interval`, tais que
 * `start + duration <= endMin` (regra 11.4: o serviço precisa caber antes do fim).
 */
export function generateCandidates({
  startMin,
  endMin,
  interval,
  duration,
}: GenerateCandidatesInput): number[] {
  const result: number[] = [];
  for (let t = startMin; t + duration <= endMin; t += interval) {
    result.push(t);
  }
  return result;
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/domain/slots.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commitar**

```bash
git add src/domain/slots.ts src/domain/slots.test.ts
git commit -m "feat: candidate slot generation"
```

---

### Task 6: Domínio — disponibilidade composta (TDD)

**Files:**
- Create: `src/domain/availability.ts`
- Test: `src/domain/availability.test.ts`

- [ ] **Step 1: Escrever o teste que falha**

Create `src/domain/availability.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { computeAvailableSlots } from "./availability";

const base = {
  isOpen: true,
  isDayClosed: false,
  startMin: 540, // 9h
  endMin: 660, // 11h
  interval: 30,
  duration: 30,
  busy: [] as { startMin: number; endMin: number }[],
  earliestStartMin: 0,
};

describe("computeAvailableSlots", () => {
  it("returns all fitting slots when nothing blocks", () => {
    expect(computeAvailableSlots(base)).toEqual([540, 570, 600, 630]);
  });

  it("returns [] when the weekday is not open", () => {
    expect(computeAvailableSlots({ ...base, isOpen: false })).toEqual([]);
  });

  it("returns [] when the day is closed (DayClosure)", () => {
    expect(computeAvailableSlots({ ...base, isDayClosed: true })).toEqual([]);
  });

  it("removes slots overlapping an existing appointment", () => {
    // ocupado 10h-10h30 (600-630) -> remove o slot 600; 570+30=600 não sobrepõe (borda)
    const busy = [{ startMin: 600, endMin: 630 }];
    expect(computeAvailableSlots({ ...base, busy })).toEqual([540, 570, 630]);
  });

  it("removes slots starting before earliestStartMin (past times today)", () => {
    // hoje já passou das 9h30; só valem 570,600,630... mas 570 começa em 570 >= 575? não
    expect(computeAvailableSlots({ ...base, earliestStartMin: 575 })).toEqual([600, 630]);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/domain/availability.test.ts`
Expected: FAIL — `computeAvailableSlots` não existe.

- [ ] **Step 3: Implementar**

Create `src/domain/availability.ts`:

```typescript
import { overlaps } from "./interval";
import { generateCandidates } from "./slots";

export interface BusyInterval {
  startMin: number;
  endMin: number;
}

export interface AvailabilityInput {
  isOpen: boolean;
  isDayClosed: boolean;
  startMin: number;
  endMin: number;
  interval: number;
  duration: number;
  busy: BusyInterval[];
  /** Slots devem começar em ou após este minuto (ex: minuto atual quando é hoje). */
  earliestStartMin: number;
}

/**
 * Slots livres (minutos da meia-noite) para um serviço num dia.
 * Aplica regras 11.3 (conflito), 11.4 (encaixe da duração), 11.5 (dia fechado),
 * 21.2 (horário passado) e disponibilidade do dia da semana.
 */
export function computeAvailableSlots(input: AvailabilityInput): number[] {
  if (!input.isOpen || input.isDayClosed) return [];

  const candidates = generateCandidates({
    startMin: input.startMin,
    endMin: input.endMin,
    interval: input.interval,
    duration: input.duration,
  });

  return candidates.filter((start) => {
    if (start < input.earliestStartMin) return false;
    const end = start + input.duration;
    const conflict = input.busy.some((b) =>
      overlaps(start, end, b.startMin, b.endMin),
    );
    return !conflict;
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/domain/availability.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commitar**

```bash
git add src/domain/availability.ts src/domain/availability.test.ts
git commit -m "feat: compose available slots with all blocking rules"
```

---

### Task 7: Portas e adapters de dev

**Files:**
- Create: `src/ports/otp-sender.ts`, `src/ports/file-storage.ts`
- Create: `src/adapters/mock-otp-sender.ts`, `src/adapters/mock-otp-sender.test.ts`
- Create: `src/adapters/local-file-storage.ts`, `src/adapters/local-file-storage.test.ts`

- [ ] **Step 1: Definir as interfaces (portas)**

Create `src/ports/otp-sender.ts`:

```typescript
export interface OtpSender {
  /** Envia o código OTP para o telefone informado. */
  send(phone: string, code: string): Promise<void>;
}
```

Create `src/ports/file-storage.ts`:

```typescript
export interface FileStorage {
  /**
   * Persiste o arquivo sob `key` e devolve a URL pública para acessá-lo.
   */
  save(key: string, data: Buffer, contentType: string): Promise<string>;
}
```

- [ ] **Step 2: Teste do MockOtpSender (falha primeiro)**

Create `src/adapters/mock-otp-sender.test.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { MockOtpSender } from "./mock-otp-sender";

describe("MockOtpSender", () => {
  it("logs the code and records the last sent message", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    const sender = new MockOtpSender();

    await sender.send("11999999999", "123456");

    expect(sender.lastSent).toEqual({ phone: "11999999999", code: "123456" });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/adapters/mock-otp-sender.test.ts`
Expected: FAIL — `MockOtpSender` não existe.

- [ ] **Step 4: Implementar MockOtpSender**

Create `src/adapters/mock-otp-sender.ts`:

```typescript
import type { OtpSender } from "@/ports/otp-sender";

/** Adapter de desenvolvimento: imprime o código no console. */
export class MockOtpSender implements OtpSender {
  lastSent: { phone: string; code: string } | null = null;

  async send(phone: string, code: string): Promise<void> {
    this.lastSent = { phone, code };
    console.log(`[OTP] para ${phone}: ${code}`);
  }
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/adapters/mock-otp-sender.test.ts`
Expected: 1 passed.

- [ ] **Step 6: Teste do LocalFileStorage (falha primeiro)**

Create `src/adapters/local-file-storage.test.ts`:

```typescript
import { describe, it, expect, afterEach } from "vitest";
import { LocalFileStorage } from "./local-file-storage";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.join(process.cwd(), "public", "uploads");

describe("LocalFileStorage", () => {
  afterEach(async () => {
    await fs.rm(path.join(root, "test-key.png"), { force: true });
  });

  it("writes the file under public/uploads and returns a public URL", async () => {
    const storage = new LocalFileStorage();
    const url = await storage.save("test-key.png", Buffer.from("abc"), "image/png");

    expect(url).toBe("/uploads/test-key.png");
    const written = await fs.readFile(path.join(root, "test-key.png"), "utf8");
    expect(written).toBe("abc");
  });
});
```

- [ ] **Step 7: Rodar e ver falhar**

Run: `npx vitest run src/adapters/local-file-storage.test.ts`
Expected: FAIL — `LocalFileStorage` não existe.

- [ ] **Step 8: Implementar LocalFileStorage**

Create `src/adapters/local-file-storage.ts`:

```typescript
import type { FileStorage } from "@/ports/file-storage";
import fs from "node:fs/promises";
import path from "node:path";

/** Adapter de desenvolvimento: grava em public/uploads e serve via /uploads/<key>. */
export class LocalFileStorage implements FileStorage {
  private readonly root = path.join(process.cwd(), "public", "uploads");

  async save(key: string, data: Buffer, _contentType: string): Promise<string> {
    await fs.mkdir(this.root, { recursive: true });
    await fs.writeFile(path.join(this.root, key), data);
    return `/uploads/${key}`;
  }
}
```

- [ ] **Step 9: Rodar e ver passar**

Run: `npx vitest run src/adapters/local-file-storage.test.ts`
Expected: 1 passed.

- [ ] **Step 10: Commitar**

```bash
git add src/ports src/adapters
git commit -m "feat: otp and file-storage ports with dev adapters"
```

---

### Task 8: Singleton do Prisma Client

**Files:**
- Create: `src/lib/prisma.ts`

- [ ] **Step 1: Implementar o singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 2: Verificar que compila**

Run: `npx tsc --noEmit`
Expected: sem erros de tipo.

- [ ] **Step 3: Rodar a suíte inteira**

Run: `npm test`
Expected: todos os testes passam (interval, slots, availability, mock-otp-sender, local-file-storage).

- [ ] **Step 4: Commitar**

```bash
git add src/lib/prisma.ts
git commit -m "feat: prisma client singleton"
```

---

## Done quando

- `npm test` verde com a lógica de disponibilidade/conflito coberta.
- `npx tsc --noEmit` sem erros.
- Schema migrado no Postgres.
- Portas + adapters de dev prontos para os planos seguintes.

**Próximo:** Plano 2 — Autenticação + área do admin da plataforma.
