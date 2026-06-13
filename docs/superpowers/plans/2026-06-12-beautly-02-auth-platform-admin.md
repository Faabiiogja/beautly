# Beautly MVP — Plano 2: Autenticação + Admin da Plataforma

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar login por e-mail+senha com sessão por cookie, papéis (`PLATFORM_ADMIN`/`PROFESSIONAL`), proteção de rotas, e a área do admin da plataforma para cadastrar, ativar e inativar profissionais (cada uma com seu negócio isolado).

**Architecture:** Senha com hash (bcryptjs), sessão via iron-session (cookie httpOnly). Serviços orquestram repositórios Prisma escopados por `businessId`. Páginas Server Components + Server Actions. Testes de serviço rodam contra um Postgres de teste com reset entre casos.

**Tech Stack:** Next.js App Router, iron-session, bcryptjs, Zod, Prisma, Vitest.

**Depende de:** Plano 1 concluído.

---

## Estrutura de arquivos deste plano

- `src/lib/password.ts` (+test) — hash/verify de senha
- `src/lib/session.ts` — config iron-session, get/destroy
- `src/test/db.ts` — helper de reset do Postgres de teste
- `src/test/setup.ts` + `vitest.config.ts` (modificar) — carregar env nos testes
- `src/repositories/user-repository.ts` — busca de usuário
- `src/services/auth-service.ts` (+test) — autenticação
- `src/services/professional-service.ts` (+test) — cadastro/ativação de profissional
- `src/lib/auth-guard.ts` — `requireUser`/`requireRole`
- `middleware.ts` — proteção de `/platform` e `/admin`
- `src/app/platform/login/page.tsx` + `actions.ts` — login
- `src/app/platform/page.tsx` — lista de profissionais
- `src/app/platform/professionals/new/page.tsx` + `actions.ts` — cadastro
- `prisma/seed.ts` — admin inicial

---

### Task 1: Hash de senha (TDD)

**Files:**
- Create: `src/lib/password.ts`, `src/lib/password.test.ts`

- [ ] **Step 1: Instalar bcryptjs**

```bash
npm install bcryptjs
npm install -D @types/bcryptjs
```

- [ ] **Step 2: Teste que falha**

Create `src/lib/password.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("verifies a correct password against its hash", async () => {
    const hash = await hashPassword("segredo123");
    expect(await verifyPassword("segredo123", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hash = await hashPassword("segredo123");
    expect(await verifyPassword("errado", hash)).toBe(false);
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx vitest run src/lib/password.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implementar**

Create `src/lib/password.ts`:

```typescript
import bcrypt from "bcryptjs";

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/lib/password.test.ts`
Expected: 2 passed.

- [ ] **Step 6: Commitar**

```bash
git add src/lib/password.ts src/lib/password.test.ts
git commit -m "feat: password hashing helpers"
```

---

### Task 2: Sessão (iron-session)

**Files:**
- Create: `src/lib/session.ts`
- Modify: `.env`, `.env.example`

- [ ] **Step 1: Instalar iron-session**

```bash
npm install iron-session
```

- [ ] **Step 2: Adicionar segredo ao env**

Em `.env` adicione (mínimo 32 caracteres):

```
SESSION_SECRET="troque-este-segredo-com-no-minimo-32-caracteres"
```

Em `.env.example` adicione:

```
SESSION_SECRET="um-segredo-aleatorio-com-no-minimo-32-chars"
```

- [ ] **Step 3: Implementar o helper de sessão**

Create `src/lib/session.ts`:

```typescript
import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  userId: string;
  role: "PLATFORM_ADMIN" | "PROFESSIONAL";
  businessId: string | null;
}

const options: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "beautly_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, options);
}
```

- [ ] **Step 4: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 5: Commitar**

```bash
git add src/lib/session.ts .env.example
git commit -m "feat: iron-session setup"
```

---

### Task 3: Infra de teste contra Postgres

**Files:**
- Create: `src/test/db.ts`, `src/test/setup.ts`
- Modify: `vitest.config.ts`
- Create: `.env.test`, `.env.test.example`

- [ ] **Step 1: Criar banco de teste e env**

`.env.test` (não commitar):

```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beautly_test?schema=public"
SESSION_SECRET="segredo-de-teste-com-no-minimo-32-caracteres-ok"
```

`.env.test.example` (commitar): mesmas chaves com valores genéricos.

Aplique o schema no banco de teste:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/beautly_test?schema=public" npx prisma migrate deploy
```

- [ ] **Step 2: Instalar dotenv**

```bash
npm install -D dotenv
```

- [ ] **Step 3: Setup de testes carrega `.env.test`**

Create `src/test/setup.ts`:

```typescript
import { config } from "dotenv";
config({ path: ".env.test" });
```

- [ ] **Step 4: Apontar vitest para o setup**

Substitua `vitest.config.ts` por:

```typescript
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["src/test/setup.ts"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
});
```

- [ ] **Step 5: Helper de reset**

Create `src/test/db.ts`:

```typescript
import { prisma } from "@/lib/prisma";

/** Limpa as tabelas na ordem segura de FKs. Use em beforeEach de testes de integração. */
export async function resetDb() {
  await prisma.appointment.deleteMany();
  await prisma.otpVerification.deleteMany();
  await prisma.dayClosure.deleteMany();
  await prisma.weeklyHours.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.business.deleteMany();
}
```

- [ ] **Step 6: Verificar que a suíte ainda roda**

Run: `npm test`
Expected: testes do Plano 1 continuam passando.

- [ ] **Step 7: Commitar**

```bash
git add vitest.config.ts src/test .env.test.example
git commit -m "test: postgres test infra with reset helper"
```

---

### Task 4: UserRepository + AuthService (integração, TDD)

**Files:**
- Create: `src/repositories/user-repository.ts`
- Create: `src/services/auth-service.ts`, `src/services/auth-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/auth-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { hashPassword } from "@/lib/password";
import { authenticate } from "./auth-service";

beforeEach(async () => {
  await resetDb();
});

describe("authenticate", () => {
  it("returns the session payload for valid credentials", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });

    const result = await authenticate("admin@beautly.com", "senha123");
    expect(result).toMatchObject({ role: "PLATFORM_ADMIN", businessId: null });
    expect(result?.userId).toBeDefined();
  });

  it("returns null for wrong password", async () => {
    await prisma.user.create({
      data: {
        email: "admin@beautly.com",
        passwordHash: await hashPassword("senha123"),
        role: "PLATFORM_ADMIN",
      },
    });
    expect(await authenticate("admin@beautly.com", "errada")).toBeNull();
  });

  it("returns null for unknown email", async () => {
    expect(await authenticate("nao@existe.com", "x")).toBeNull();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/auth-service.test.ts`
Expected: FAIL — `authenticate` não existe.

- [ ] **Step 3: Implementar repositório**

Create `src/repositories/user-repository.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}
```

- [ ] **Step 4: Implementar serviço**

Create `src/services/auth-service.ts`:

```typescript
import { findUserByEmail } from "@/repositories/user-repository";
import { verifyPassword } from "@/lib/password";
import type { SessionData } from "@/lib/session";

export async function authenticate(
  email: string,
  password: string,
): Promise<SessionData | null> {
  const user = await findUserByEmail(email);
  if (!user) return null;
  if (!(await verifyPassword(password, user.passwordHash))) return null;
  return { userId: user.id, role: user.role, businessId: user.businessId };
}
```

- [ ] **Step 5: Rodar e ver passar**

Run: `npx vitest run src/services/auth-service.test.ts`
Expected: 3 passed.

- [ ] **Step 6: Commitar**

```bash
git add src/repositories/user-repository.ts src/services/auth-service.ts src/services/auth-service.test.ts
git commit -m "feat: authenticate service"
```

---

### Task 5: Guards de sessão + middleware

**Files:**
- Create: `src/lib/auth-guard.ts`
- Create: `middleware.ts` (raiz do projeto)

- [ ] **Step 1: Implementar guards**

Create `src/lib/auth-guard.ts`:

```typescript
import { redirect } from "next/navigation";
import { getSession, type SessionData } from "@/lib/session";

export async function requireUser(): Promise<SessionData> {
  const session = await getSession();
  if (!session.userId) redirect("/platform/login");
  return session;
}

export async function requirePlatformAdmin(): Promise<SessionData> {
  const session = await requireUser();
  if (session.role !== "PLATFORM_ADMIN") redirect("/platform/login");
  return session;
}

export async function requireProfessional(): Promise<SessionData> {
  const session = await requireUser();
  if (session.role !== "PROFESSIONAL" || !session.businessId) {
    redirect("/admin/login");
  }
  return session;
}
```

- [ ] **Step 2: Middleware de proteção das áreas**

Create `middleware.ts` na raiz:

```typescript
import { NextResponse, type NextRequest } from "next/server";

/**
 * Guarda rasa: barra acesso a /platform e /admin sem cookie de sessão.
 * A checagem de papel acontece nos guards de servidor (auth-guard).
 */
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has("beautly_session");
  const { pathname } = req.nextUrl;

  const isLogin = pathname === "/platform/login" || pathname === "/admin/login";
  const isProtected = pathname.startsWith("/platform") || pathname.startsWith("/admin");

  if (isProtected && !isLogin && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/platform/login";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/platform/:path*", "/admin/:path*"],
};
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commitar**

```bash
git add src/lib/auth-guard.ts middleware.ts
git commit -m "feat: session guards and route middleware"
```

---

### Task 6: Login do admin da plataforma

**Files:**
- Create: `src/app/platform/login/page.tsx`, `src/app/platform/login/actions.ts`

- [ ] **Step 1: Server action de login**

Create `src/app/platform/login/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { authenticate } from "@/services/auth-service";
import { getSession } from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(_prev: unknown, formData: FormData) {
  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Dados inválidos." };

  const result = await authenticate(parsed.data.email, parsed.data.password);
  if (!result) return { error: "E-mail ou senha incorretos." };

  const session = await getSession();
  session.userId = result.userId;
  session.role = result.role;
  session.businessId = result.businessId;
  await session.save();

  redirect(result.role === "PLATFORM_ADMIN" ? "/platform" : "/admin");
}
```

- [ ] **Step 2: Página de login**

Create `src/app/platform/login/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function PlatformLoginPage() {
  const [state, action, pending] = useActionState(loginAction, null);

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="mb-6 text-xl font-semibold">Beautly — Admin</h1>
      <form action={action} className="space-y-4">
        <input
          name="email"
          type="email"
          placeholder="E-mail"
          required
          className="w-full rounded border p-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Senha"
          required
          className="w-full rounded border p-2"
        />
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-black p-2 text-white disabled:opacity-50"
        >
          {pending ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Verificar compilação**

Run: `npx tsc --noEmit`
Expected: sem erros.

- [ ] **Step 4: Commitar**

```bash
git add src/app/platform/login
git commit -m "feat: platform admin login"
```

---

### Task 7: Serviço de cadastro de profissional (integração, TDD)

Cadastrar uma profissional cria, numa transação: o `Business`, o `User` `PROFESSIONAL` ligado a ele, e 7 linhas de `WeeklyHours` (seg–sex abertas 9h–18h por padrão; sáb/dom fechadas) para a página já nascer com agenda.

**Files:**
- Create: `src/services/professional-service.ts`, `src/services/professional-service.test.ts`

- [ ] **Step 1: Teste que falha**

Create `src/services/professional-service.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/test/db";
import { verifyPassword } from "@/lib/password";
import {
  createProfessional,
  setProfessionalStatus,
  listProfessionals,
} from "./professional-service";

beforeEach(async () => {
  await resetDb();
});

describe("createProfessional", () => {
  it("creates business, professional user and 7 weekly-hours rows", async () => {
    const result = await createProfessional({
      businessName: "Maria Nails",
      slug: "maria-nails",
      contactPhone: "11999999999",
      email: "maria@beautly.com",
      password: "senha123",
      startActive: true,
    });

    const business = await prisma.business.findUniqueOrThrow({
      where: { id: result.businessId },
    });
    expect(business.status).toBe("ACTIVE");
    expect(business.slug).toBe("maria-nails");

    const user = await prisma.user.findUniqueOrThrow({
      where: { email: "maria@beautly.com" },
    });
    expect(user.role).toBe("PROFESSIONAL");
    expect(user.businessId).toBe(result.businessId);
    expect(await verifyPassword("senha123", user.passwordHash)).toBe(true);

    const hours = await prisma.weeklyHours.findMany({
      where: { businessId: result.businessId },
    });
    expect(hours).toHaveLength(7);
    const weekdays = hours.filter((h) => h.weekday >= 1 && h.weekday <= 5);
    expect(weekdays.every((h) => h.isOpen)).toBe(true);
  });

  it("can create an inactive professional", async () => {
    const result = await createProfessional({
      businessName: "Ana Lash",
      slug: "ana-lash",
      contactPhone: "11988888888",
      email: "ana@beautly.com",
      password: "senha123",
      startActive: false,
    });
    const business = await prisma.business.findUniqueOrThrow({
      where: { id: result.businessId },
    });
    expect(business.status).toBe("INACTIVE");
  });

  it("rejects a duplicate slug", async () => {
    const data = {
      businessName: "X",
      slug: "dup",
      contactPhone: "1",
      email: "x@x.com",
      password: "senha123",
      startActive: true,
    };
    await createProfessional(data);
    await expect(
      createProfessional({ ...data, email: "y@y.com" }),
    ).rejects.toThrow();
  });
});

describe("setProfessionalStatus / listProfessionals", () => {
  it("toggles status and lists businesses", async () => {
    const { businessId } = await createProfessional({
      businessName: "Maria Nails",
      slug: "maria-nails",
      contactPhone: "11999999999",
      email: "maria@beautly.com",
      password: "senha123",
      startActive: true,
    });

    await setProfessionalStatus(businessId, "INACTIVE");
    const list = await listProfessionals();
    expect(list).toHaveLength(1);
    expect(list[0].status).toBe("INACTIVE");
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx vitest run src/services/professional-service.test.ts`
Expected: FAIL — funções não existem.

- [ ] **Step 3: Implementar o serviço**

Create `src/services/professional-service.ts`:

```typescript
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { BusinessStatus } from "@prisma/client";

export interface CreateProfessionalInput {
  businessName: string;
  slug: string;
  contactPhone: string;
  email: string;
  password: string;
  startActive: boolean;
}

function defaultWeeklyHours() {
  // 0=domingo ... 6=sábado. Seg–sex abertas 9h–18h.
  return Array.from({ length: 7 }, (_, weekday) => {
    const isWeekday = weekday >= 1 && weekday <= 5;
    return {
      weekday,
      isOpen: isWeekday,
      startTime: "09:00",
      endTime: "18:00",
    };
  });
}

export async function createProfessional(input: CreateProfessionalInput) {
  const passwordHash = await hashPassword(input.password);

  const business = await prisma.business.create({
    data: {
      slug: input.slug,
      name: input.businessName,
      contactPhone: input.contactPhone,
      status: input.startActive ? "ACTIVE" : "INACTIVE",
      weeklyHours: { create: defaultWeeklyHours() },
      users: {
        create: {
          email: input.email,
          passwordHash,
          role: "PROFESSIONAL",
        },
      },
    },
  });

  return { businessId: business.id };
}

export async function setProfessionalStatus(
  businessId: string,
  status: BusinessStatus,
) {
  await prisma.business.update({ where: { id: businessId }, data: { status } });
}

export function listProfessionals() {
  return prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    include: { users: true },
  });
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npx vitest run src/services/professional-service.test.ts`
Expected: todos passam.

- [ ] **Step 5: Commitar**

```bash
git add src/services/professional-service.ts src/services/professional-service.test.ts
git commit -m "feat: professional onboarding service"
```

---

### Task 8: Telas do admin da plataforma

**Files:**
- Create: `src/app/platform/page.tsx`
- Create: `src/app/platform/professionals/new/page.tsx`, `src/app/platform/professionals/new/actions.ts`
- Create: `src/app/platform/actions.ts` (toggle status)

- [ ] **Step 1: Action de toggle de status**

Create `src/app/platform/actions.ts`:

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth-guard";
import { setProfessionalStatus } from "@/services/professional-service";

export async function toggleStatusAction(formData: FormData) {
  await requirePlatformAdmin();
  const businessId = String(formData.get("businessId"));
  const next = String(formData.get("next")) as "ACTIVE" | "INACTIVE";
  await setProfessionalStatus(businessId, next);
  revalidatePath("/platform");
}
```

- [ ] **Step 2: Lista de profissionais**

Create `src/app/platform/page.tsx`:

```tsx
import Link from "next/link";
import { requirePlatformAdmin } from "@/lib/auth-guard";
import { listProfessionals } from "@/services/professional-service";
import { toggleStatusAction } from "./actions";

export default async function PlatformHome() {
  await requirePlatformAdmin();
  const professionals = await listProfessionals();

  return (
    <main className="mx-auto max-w-3xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Profissionais</h1>
        <Link href="/platform/professionals/new" className="rounded bg-black px-3 py-2 text-white">
          Nova profissional
        </Link>
      </div>
      <ul className="divide-y">
        {professionals.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-gray-500">/{p.slug} · {p.status}</p>
            </div>
            <form action={toggleStatusAction}>
              <input type="hidden" name="businessId" value={p.id} />
              <input
                type="hidden"
                name="next"
                value={p.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"}
              />
              <button className="rounded border px-3 py-1 text-sm">
                {p.status === "ACTIVE" ? "Inativar" : "Ativar"}
              </button>
            </form>
          </li>
        ))}
        {professionals.length === 0 && (
          <li className="py-3 text-sm text-gray-500">Nenhuma profissional cadastrada.</li>
        )}
      </ul>
    </main>
  );
}
```

- [ ] **Step 3: Action de cadastro**

Create `src/app/platform/professionals/new/actions.ts`:

```typescript
"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth-guard";
import { createProfessional } from "@/services/professional-service";

const schema = z.object({
  businessName: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífen."),
  contactPhone: z.string().min(8),
  email: z.string().email(),
  password: z.string().min(6),
  startActive: z.coerce.boolean(),
});

export async function createProfessionalAction(_prev: unknown, formData: FormData) {
  await requirePlatformAdmin();
  const parsed = schema.safeParse({
    businessName: formData.get("businessName"),
    slug: formData.get("slug"),
    contactPhone: formData.get("contactPhone"),
    email: formData.get("email"),
    password: formData.get("password"),
    startActive: formData.get("startActive") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Dados inválidos." };
  }

  try {
    await createProfessional(parsed.data);
  } catch {
    return { error: "Slug ou e-mail já em uso." };
  }
  redirect("/platform");
}
```

- [ ] **Step 4: Página de cadastro**

Create `src/app/platform/professionals/new/page.tsx`:

```tsx
"use client";

import { useActionState } from "react";
import { createProfessionalAction } from "./actions";

export default function NewProfessionalPage() {
  const [state, action, pending] = useActionState(createProfessionalAction, null);

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-xl font-semibold">Nova profissional</h1>
      <form action={action} className="space-y-4">
        <input name="businessName" placeholder="Nome do negócio" required className="w-full rounded border p-2" />
        <input name="slug" placeholder="slug-da-pagina" required className="w-full rounded border p-2" />
        <input name="contactPhone" placeholder="Telefone de contato" required className="w-full rounded border p-2" />
        <input name="email" type="email" placeholder="E-mail de acesso" required className="w-full rounded border p-2" />
        <input name="password" type="password" placeholder="Senha inicial" required className="w-full rounded border p-2" />
        <label className="flex items-center gap-2 text-sm">
          <input name="startActive" type="checkbox" defaultChecked /> Iniciar ativa
        </label>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded bg-black p-2 text-white disabled:opacity-50">
          {pending ? "Salvando..." : "Cadastrar"}
        </button>
      </form>
    </main>
  );
}
```

- [ ] **Step 5: Verificar compilação e build**

Run: `npx tsc --noEmit && npm run build`
Expected: build sem erros.

- [ ] **Step 6: Commitar**

```bash
git add src/app/platform
git commit -m "feat: platform admin screens"
```

---

### Task 9: Seed do admin inicial

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (config `prisma.seed`)

- [ ] **Step 1: Instalar tsx**

```bash
npm install -D tsx
```

- [ ] **Step 2: Script de seed**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@beautly.com";
  const password = process.env.ADMIN_PASSWORD ?? "admin123456";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin ${email} já existe.`);
    return;
  }

  await prisma.user.create({
    data: {
      email,
      passwordHash: await bcrypt.hash(password, 10),
      role: "PLATFORM_ADMIN",
    },
  });
  console.log(`Admin criado: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 3: Registrar o seed no package.json**

Adicione ao `package.json` (nível raiz):

```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 4: Rodar o seed**

Run: `npx prisma db seed`
Expected: "Admin criado: admin@beautly.com".

- [ ] **Step 5: Rodar suíte completa**

Run: `npm test`
Expected: todos os testes passam.

- [ ] **Step 6: Commitar**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: seed initial platform admin"
```

---

## Done quando

- Admin loga em `/platform/login`, cadastra profissional (com negócio + agenda padrão), ativa/inativa.
- Profissional inativa nasce com `status=INACTIVE`.
- Slug/e-mail duplicado é rejeitado.
- `npm test` verde; `npm run build` sem erros.

**Próximo:** Plano 3 — Área da profissional (negócio, serviços, agenda, fechar dia).
