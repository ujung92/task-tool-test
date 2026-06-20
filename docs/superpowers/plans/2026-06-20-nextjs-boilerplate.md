# Next.js 보일러플레이트 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 초보자가 README만 보고 실행·확장할 수 있는, 기능별로 잘 모듈화된 Next.js 풀스택 보일러플레이트(이메일/비번 자체 인증 + Prisma/SQLite + User 단일 스키마)를 만든다.

**Architecture:** App Router에서 페이지(`app/`)는 화면 조립만 담당하고, 실제 로직(서버 액션·검증·세션·조회)은 `features/<도메인>/`에 모은다. 인증은 외부 라이브러리 없이 Server Actions + bcryptjs(해싱) + jose(서명된 JWT 세션 쿠키) + middleware(보호 라우트)로 직접 구현해 "동작 원리가 코드에 다 보이게" 한다. 세션은 쿠키 기반(서버 세션 테이블 없음)이라 DB 스키마는 User 하나로 유지된다.

**Tech Stack:** Next.js(App Router, TS, `src/`, `@/*` 별칭) · Tailwind CSS v4 · Prisma + SQLite · bcryptjs · jose · zod(v3) · Vitest · ESLint + Prettier · npm

## Global Constraints

- **언어/런타임:** TypeScript, Node 20+, 패키지 매니저 npm.
- **DB 작업 방식:** Prisma `db push`(마이그레이션 파일 없음). 리셋은 `prisma db push --force-reset`.
- **스키마는 User 하나만.** 추가 도메인 모델 금지(확장은 README로 안내).
- **세션:** jose HS256 JWT, 쿠키명 `session`, `httpOnly` + `sameSite=lax` + `path=/` + 운영환경 `secure`, 만료 7일.
- **비밀번호:** 절대 평문 저장 금지. bcryptjs cost 10으로 해싱.
- **Windows 친화:** 네이티브 빌드가 필요한 패키지 금지(bcryptjs·jose는 순수 JS라 OK).
- **zod는 v3로 고정** (`zod@^3`) — `error.flatten().fieldErrors` API를 일관되게 사용.
- **테스트 전략:** 스펙대로 순수 함수 예제 테스트만 작성(`password`, `validation`). 액션·세션·미들웨어·화면은 타입체크/빌드/수동 흐름으로 검증한다(이는 의도된 범위).
- **주석:** 인증·세션 등 핵심 흐름에는 "왜"를 설명하는 짧은 한국어 주석을 단다.
- **모든 커밋 메시지 끝에 다음 줄 추가:** `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
- **각 작업은 독립 커밋으로 끝낸다.**

---

## File Structure (생성/수정 대상)

생성:
- `prisma/schema.prisma`, `prisma/seed.ts`
- `src/lib/prisma.ts`, `src/lib/env.ts`, `src/lib/utils.ts`, `src/lib/forms.ts`
- `src/features/auth/password.ts` (+ `password.test.ts`), `session.ts`, `validation.ts` (+ `validation.test.ts`), `actions.ts`
- `src/features/auth/components/LoginForm.tsx`, `SignupForm.tsx`
- `src/features/users/queries.ts`, `actions.ts`, `validation.ts`
- `src/features/users/components/ProfileForm.tsx`, `ChangePasswordForm.tsx`, `DeleteAccountButton.tsx`
- `src/components/ui/Button.tsx`, `Input.tsx`, `Label.tsx`, `FieldError.tsx`
- `src/middleware.ts`
- `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`
- `src/app/(protected)/layout.tsx`, `src/app/(protected)/dashboard/page.tsx`, `src/app/(protected)/settings/page.tsx`
- `vitest.config.ts`, `.prettierrc`, `.env`, `.env.example`, `README.md`

수정(스캐폴딩이 생성한 파일):
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `package.json`, `.gitignore`

---

## Phase 1 — 프로젝트 토대

### Task 1: Next.js 스캐폴딩 + 포맷터

**Files:**
- Create(자동): `src/app/*`, `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `.gitignore`
- Create: `.prettierrc`
- Modify: `package.json`(스크립트), `.gitignore`

**Interfaces:**
- Produces: 동작하는 Next.js 앱(App Router, TS, Tailwind v4, `@/*` 별칭), `npm run dev`/`build`/`lint`/`format` 스크립트.

- [ ] **Step 1: create-next-app 실행 (현재 폴더에)**

`docs/`와 `.git/`은 create-next-app 허용 목록이라 충돌하지 않는다.
```bash
npx create-next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```
프롬프트가 뜨면 위 플래그 값(Turbopack은 기본 Yes)대로 진행한다.

- [ ] **Step 2: 빌드로 스캐폴딩 검증**

Run: `npm run build`
Expected: 에러 없이 빌드 완료(기본 홈페이지 컴파일).

- [ ] **Step 3: Prettier 설치 + 설정**

```bash
npm i -D prettier
```
Create `.prettierrc`:
```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

- [ ] **Step 4: package.json 스크립트 추가**

create-next-app이 만든 `scripts`(dev/build/start/lint)는 **그대로 두고**, 아래 항목만 병합 추가한다. (특히 생성된 `lint` 스크립트가 `next lint`든 `eslint .`든 건드리지 않는다 — Next 버전에 따라 다름.)
```json
"format": "prettier --write .",
"test": "vitest run",
"test:watch": "vitest",
"db:push": "prisma db push",
"db:seed": "prisma db seed",
"db:studio": "prisma studio",
"db:reset": "prisma db push --force-reset && prisma db seed"
```

- [ ] **Step 5: .gitignore 조정 (.env는 무시하되 .env.example은 추적)**

`.gitignore`의 env 섹션을 아래로 교체하고, prisma DB 파일을 추가한다.
```gitignore
# env files
.env
.env*.local

# database
/prisma/dev.db
/prisma/dev.db-journal
```

- [ ] **Step 6: 포맷 적용 + 커밋**

```bash
npm run format
git add -A
git commit -m "chore: scaffold Next.js app with TS, Tailwind, Prettier"
```

---

### Task 2: Prisma + SQLite + User 스키마

**Files:**
- Create: `prisma/schema.prisma`, `src/lib/prisma.ts`, `.env`, `.env.example`
- Modify: `package.json`(prisma seed 설정 위치만 잡아둠)

**Interfaces:**
- Produces: `prisma` 클라이언트 싱글톤(`import { prisma } from '@/lib/prisma'`), `User` 테이블, 환경변수 파일.

- [ ] **Step 1: Prisma 설치**

```bash
npm i -D prisma tsx
npm i @prisma/client
```

- [ ] **Step 2: schema.prisma 작성**

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// 보일러플레이트의 유일한 모델. 세션은 쿠키(JWT)로 처리하므로 Session 테이블이 없다.
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String          // 비밀번호 원문은 저장하지 않는다(해시만)
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
```

- [ ] **Step 3: 환경변수 파일 작성**

Create `.env`:
```
DATABASE_URL="file:./dev.db"
SESSION_SECRET="dev-secret-change-me-to-a-long-random-string-32+"
```
Create `.env.example`:
```
# DB 연결 문자열 (SQLite: 프로젝트 안 파일)
DATABASE_URL="file:./dev.db"
# 세션 서명 키 — 최소 32자, 운영에서는 반드시 랜덤값으로 교체
# 예) node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET="change-me-to-a-long-random-string-of-32-chars-or-more"
```

- [ ] **Step 4: Prisma 클라이언트 싱글톤**

Create `src/lib/prisma.ts`:
```ts
import { PrismaClient } from '@prisma/client'

// 개발 중 핫리로드로 PrismaClient가 여러 번 생성되는 것을 막는 싱글톤 패턴
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 5: prisma seed 설정 추가**

`package.json` 최상위에 추가(스크립트와 별개):
```json
"prisma": {
  "seed": "tsx prisma/seed.ts"
}
```

- [ ] **Step 6: DB 생성 + 검증**

Run:
```bash
npm run db:push
```
Expected: `dev.db` 생성, "Your database is now in sync with your Prisma schema" 출력.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "feat: add Prisma + SQLite with User model"
```

---

### Task 3: 환경변수 검증 + 작은 유틸

**Files:**
- Create: `src/lib/env.ts`, `src/lib/utils.ts`

**Interfaces:**
- Produces: `env`(검증된 환경변수 객체), `cn(...inputs)` 클래스명 합성 헬퍼.

- [ ] **Step 1: zod + 클래스 유틸 의존성 설치**

```bash
npm i zod@^3 clsx tailwind-merge
```

- [ ] **Step 2: env.ts 작성**

Create `src/lib/env.ts`:
```ts
import { z } from 'zod'

// 앱 시작 시 환경변수를 한 번 검증한다. 누락/오류면 즉시 명확한 에러로 알린다.
const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL이 필요합니다'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET은 최소 32자 이상이어야 합니다'),
})

const parsed = schema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ 환경변수 오류:', parsed.error.flatten().fieldErrors)
  throw new Error('.env 설정을 확인하세요 (.env.example 참고)')
}

export const env = parsed.data
```

- [ ] **Step 3: utils.ts 작성**

Create `src/lib/utils.ts`:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Tailwind 클래스 충돌을 정리하며 합쳐주는 헬퍼
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- [ ] **Step 4: 타입체크 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 5: 커밋**

```bash
git add -A
git commit -m "feat: add env validation and cn() utility"
```

---

## Phase 2 — 인증 기초(순수 로직, TDD)

### Task 4: 비밀번호 해싱 + Vitest 셋업 (TDD, 예제 테스트 1)

**Files:**
- Create: `vitest.config.ts`, `src/features/auth/password.ts`, `src/features/auth/password.test.ts`

**Interfaces:**
- Produces: `hashPassword(plain: string): Promise<string>`, `verifyPassword(plain: string, hash: string): Promise<boolean>`.

- [ ] **Step 1: 테스트 의존성 설치 + vitest 설정**

```bash
npm i -D vitest vite-tsconfig-paths
npm i bcryptjs
npm i -D @types/bcryptjs
```
Create `vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths()], // 테스트에서 '@/...' 별칭 사용 가능하게
  test: { environment: 'node' },
})
```

- [ ] **Step 2: 실패하는 테스트 작성**

Create `src/features/auth/password.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { hashPassword, verifyPassword } from './password'

describe('password', () => {
  it('해시는 원문과 다르고, 같은 비번은 검증을 통과한다', async () => {
    const hash = await hashPassword('secret123')
    expect(hash).not.toBe('secret123')
    expect(await verifyPassword('secret123', hash)).toBe(true)
  })

  it('틀린 비번은 검증을 통과하지 못한다', async () => {
    const hash = await hashPassword('secret123')
    expect(await verifyPassword('wrong-password', hash)).toBe(false)
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

Run: `npx vitest run src/features/auth/password.test.ts`
Expected: FAIL — `password` 모듈을 찾을 수 없음.

- [ ] **Step 4: 최소 구현**

Create `src/features/auth/password.ts`:
```ts
import bcrypt from 'bcryptjs'

// 비밀번호는 평문 저장 금지. 저장 전 해싱하고, 로그인 시 비교만 한다.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run src/features/auth/password.test.ts`
Expected: PASS (2 passed).

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add password hashing with Vitest setup"
```

---

### Task 5: 입력 검증 스키마 (TDD, 예제 테스트 2)

**Files:**
- Create: `src/features/auth/validation.ts`, `src/features/auth/validation.test.ts`, `src/features/users/validation.ts`

**Interfaces:**
- Produces: `signupSchema`, `loginSchema`(auth) / `updateProfileSchema`, `changePasswordSchema`(users) zod 스키마.

- [ ] **Step 1: 실패하는 테스트 작성**

Create `src/features/auth/validation.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { signupSchema } from './validation'

describe('signupSchema', () => {
  it('유효한 입력을 통과시킨다', () => {
    const r = signupSchema.safeParse({ email: 'a@b.com', password: '12345678' })
    expect(r.success).toBe(true)
  })

  it('8자 미만 비밀번호를 거른다', () => {
    const r = signupSchema.safeParse({ email: 'a@b.com', password: '123' })
    expect(r.success).toBe(false)
  })

  it('잘못된 이메일을 거른다', () => {
    const r = signupSchema.safeParse({ email: 'not-email', password: '12345678' })
    expect(r.success).toBe(false)
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run src/features/auth/validation.test.ts`
Expected: FAIL — `validation` 모듈 없음.

- [ ] **Step 3: auth 검증 스키마 구현**

Create `src/features/auth/validation.ts`:
```ts
import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().trim().max(50).optional(),
  email: z.string().trim().email('올바른 이메일을 입력하세요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
})

export const loginSchema = z.object({
  email: z.string().trim().email('올바른 이메일을 입력하세요'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
})
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run src/features/auth/validation.test.ts`
Expected: PASS (3 passed).

- [ ] **Step 5: users 검증 스키마 구현**

Create `src/features/users/validation.ts`:
```ts
import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().max(50).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
})
```

- [ ] **Step 6: 커밋**

```bash
git add -A
git commit -m "feat: add zod validation schemas for auth and users"
```

---

### Task 6: 세션 (jose JWT 쿠키)

**Files:**
- Create: `src/features/auth/session.ts`

**Interfaces:**
- Consumes: `env`(`@/lib/env`).
- Produces: `encrypt(payload)`, `decrypt(token?)`, `createSession(userId)`, `getSession()`, `deleteSession()`, 타입 `SessionPayload = { userId: string }`.

- [ ] **Step 1: jose 설치**

```bash
npm i jose
```

- [ ] **Step 2: session.ts 작성**

Create `src/features/auth/session.ts`:
```ts
import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

const key = new TextEncoder().encode(env.SESSION_SECRET)
const COOKIE = 'session'
const MAX_AGE = 60 * 60 * 24 * 7 // 7일(초)

export type SessionPayload = { userId: string }

// 페이로드를 서명된 JWT 문자열로 만든다(순수 함수, 쿠키와 무관)
export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key)
}

// JWT를 검증해 페이로드를 돌려준다. 위조/만료면 null.
export async function decrypt(token?: string): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] })
    return { userId: String(payload.userId) }
  } catch {
    return null
  }
}

// 로그인 성공 시 세션 쿠키를 굽는다(httpOnly라 JS에서 접근 불가 → XSS 안전)
export async function createSession(userId: string) {
  const token = await encrypt({ userId })
  const store = await cookies()
  store.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE,
  })
}

// 현재 요청의 쿠키에서 세션을 읽어 검증한다.
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies()
  return decrypt(store.get(COOKIE)?.value)
}

export async function deleteSession() {
  const store = await cookies()
  store.delete(COOKIE)
}
```

- [ ] **Step 3: 타입체크 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add JWT cookie session helpers"
```

---

## Phase 3 — 서버 액션 & 조회

### Task 7: 공용 폼 상태 타입 + 인증 서버 액션

**Files:**
- Create: `src/lib/forms.ts`, `src/features/auth/actions.ts`

**Interfaces:**
- Consumes: `prisma`, `hashPassword`/`verifyPassword`, `createSession`/`deleteSession`, `signupSchema`/`loginSchema`.
- Produces: 타입 `FormState`; 액션 `signup(prev, formData)`, `login(prev, formData)`, `logout()`.

- [ ] **Step 1: FormState 타입**

Create `src/lib/forms.ts`:
```ts
// 모든 폼 서버 액션이 공유하는 반환 타입(useActionState와 함께 사용)
export type FormState =
  | {
      error?: string // 폼 전체 에러 메시지
      success?: string // 성공 메시지
      fieldErrors?: Record<string, string[] | undefined> // 필드별 검증 에러
    }
  | undefined
```

- [ ] **Step 2: 인증 액션 작성**

Create `src/features/auth/actions.ts`:
```ts
'use server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { hashPassword, verifyPassword } from './password'
import { createSession, deleteSession } from './session'
import { signupSchema, loginSchema } from './validation'
import type { FormState } from '@/lib/forms'

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: (formData.get('name') as string) || undefined,
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const { email, password, name } = parsed.data
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: '이미 가입된 이메일입니다.' }

  const passwordHash = await hashPassword(password)
  const user = await prisma.user.create({
    data: { email, passwordHash, name: name || null },
  })
  await createSession(user.id)
  redirect('/dashboard')
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const { email, password } = parsed.data
  const user = await prisma.user.findUnique({ where: { email } })
  // 보안: 이메일 존재 여부를 노출하지 않도록 동일한 메시지를 쓴다
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }
  await createSession(user.id)
  redirect('/dashboard')
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}
```

- [ ] **Step 3: 타입체크 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add auth server actions (signup/login/logout)"
```

---

### Task 8: 현재 유저 조회 + 유저 서버 액션

**Files:**
- Create: `src/features/users/queries.ts`, `src/features/users/actions.ts`

**Interfaces:**
- Consumes: `prisma`, `getSession`, `getCurrentUser`, `hashPassword`/`verifyPassword`, `deleteSession`, users 검증 스키마.
- Produces: `getCurrentUser()`(없으면 null); 액션 `updateProfile(prev, formData)`, `changePassword(prev, formData)`, `deleteAccount()`.

- [ ] **Step 1: queries.ts 작성**

Create `src/features/users/queries.ts`:
```ts
import 'server-only'
import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/features/auth/session'

// cache()로 같은 요청 안에서 중복 조회를 막는다.
export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session) return null
  return prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  })
})
```

- [ ] **Step 2: actions.ts 작성**

Create `src/features/users/actions.ts`:
```ts
'use server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './queries'
import { hashPassword, verifyPassword } from '@/features/auth/password'
import { deleteSession } from '@/features/auth/session'
import { updateProfileSchema, changePasswordSchema } from './validation'
import type { FormState } from '@/lib/forms'

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = updateProfileSchema.safeParse({ name: (formData.get('name') as string) || undefined })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  await prisma.user.update({ where: { id: user.id }, data: { name: parsed.data.name || null } })
  revalidatePath('/dashboard')
  revalidatePath('/settings')
  return { success: '저장되었습니다.' }
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
  })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  // getCurrentUser는 passwordHash를 select하지 않으므로 다시 조회한다
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser || !(await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash))) {
    return { fieldErrors: { currentPassword: ['현재 비밀번호가 올바르지 않습니다.'] } }
  }

  const passwordHash = await hashPassword(parsed.data.newPassword)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  return { success: '비밀번호가 변경되었습니다.' }
}

export async function deleteAccount() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  await prisma.user.delete({ where: { id: user.id } })
  await deleteSession()
  redirect('/')
}
```

- [ ] **Step 3: 타입체크 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add user queries and profile/password/delete actions"
```

---

### Task 9: 보호 라우트 미들웨어

**Files:**
- Create: `src/middleware.ts`

**Interfaces:**
- Produces: `/dashboard`, `/settings` 하위 접근 시 세션 쿠키 없으면 `/login`으로 리다이렉트(낙관적 체크). 실제 검증은 보호 레이아웃에서 수행(Task 12).

- [ ] **Step 1: middleware.ts 작성**

Create `src/middleware.ts`:
```ts
import { NextResponse, type NextRequest } from 'next/server'

// 엣지 런타임이라 무겁게 검증하지 않고 '쿠키 존재' 여부만 빠르게 확인한다(낙관적).
// 진짜 유저 검증은 (protected) 레이아웃의 getCurrentUser가 담당한다(이중 안전).
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('session')
  if (!hasSession) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
```

- [ ] **Step 2: 타입체크 검증**

Run: `npx tsc --noEmit`
Expected: 에러 없음.

- [ ] **Step 3: 커밋**

```bash
git add -A
git commit -m "feat: protect dashboard/settings routes via middleware"
```

---

## Phase 4 — UI & 화면

### Task 10: 공용 UI 프리미티브

**Files:**
- Create: `src/components/ui/Button.tsx`, `Input.tsx`, `Label.tsx`, `FieldError.tsx`

**Interfaces:**
- Produces: `Button`, `Input`, `Label`, `FieldError`(props: `{ messages?: string[] }`) 컴포넌트.

- [ ] **Step 1: Button**

Create `src/components/ui/Button.tsx`:
```tsx
import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Button({ className, ...props }: ComponentProps<'button'>) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 2: Input**

Create `src/components/ui/Input.tsx`:
```tsx
import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none',
        className,
      )}
      {...props}
    />
  )
}
```

- [ ] **Step 3: Label**

Create `src/components/ui/Label.tsx`:
```tsx
import { type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('mb-1 block text-sm font-medium text-gray-700', className)} {...props} />
}
```

- [ ] **Step 4: FieldError**

Create `src/components/ui/FieldError.tsx`:
```tsx
export function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null
  return <p className="mt-1 text-sm text-red-600">{messages[0]}</p>
}
```

- [ ] **Step 5: 타입체크 + 커밋**

Run: `npx tsc --noEmit` (Expected: 에러 없음)
```bash
git add -A
git commit -m "feat: add UI primitives (Button, Input, Label, FieldError)"
```

---

### Task 11: 인증 폼 + 인증 페이지

**Files:**
- Create: `src/features/auth/components/LoginForm.tsx`, `SignupForm.tsx`
- Create: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/signup/page.tsx`

**Interfaces:**
- Consumes: `login`/`signup` 액션, UI 프리미티브.
- Produces: `/login`, `/signup` 화면.

- [ ] **Step 1: LoginForm**

Create `src/features/auth/components/LoginForm.tsx`:
```tsx
'use client'
import { useActionState } from 'react'
import { login } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="password">비밀번호</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
        <FieldError messages={state?.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '로그인 중...' : '로그인'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: SignupForm**

Create `src/features/auth/components/SignupForm.tsx`:
```tsx
'use client'
import { useActionState } from 'react'
import { signup } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signup, undefined)
  return (
    <form action={formAction} className="space-y-4">
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <div>
        <Label htmlFor="name">이름 (선택)</Label>
        <Input id="name" name="name" type="text" autoComplete="name" />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>
      <div>
        <Label htmlFor="email">이메일</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
        <FieldError messages={state?.fieldErrors?.email} />
      </div>
      <div>
        <Label htmlFor="password">비밀번호 (8자 이상)</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <FieldError messages={state?.fieldErrors?.password} />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? '가입 중...' : '회원가입'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: login 페이지**

Create `src/app/(auth)/login/page.tsx`:
```tsx
import Link from 'next/link'
import { LoginForm } from '@/features/auth/components/LoginForm'

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 p-8">
      <h1 className="text-xl font-bold">로그인</h1>
      <LoginForm />
      <p className="text-sm text-gray-600">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-blue-600 underline">
          회원가입
        </Link>
      </p>
    </main>
  )
}
```

- [ ] **Step 4: signup 페이지**

Create `src/app/(auth)/signup/page.tsx`:
```tsx
import Link from 'next/link'
import { SignupForm } from '@/features/auth/components/SignupForm'

export default function SignupPage() {
  return (
    <main className="mx-auto max-w-sm space-y-6 p-8">
      <h1 className="text-xl font-bold">회원가입</h1>
      <SignupForm />
      <p className="text-sm text-gray-600">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-blue-600 underline">
          로그인
        </Link>
      </p>
    </main>
  )
}
```

- [ ] **Step 5: 빌드 검증 + 커밋**

Run: `npm run build` (Expected: 에러 없음, /login·/signup 라우트 생성)
```bash
git add -A
git commit -m "feat: add login/signup forms and pages"
```

---

### Task 12: 루트 레이아웃·홈 + 보호 레이아웃 + 대시보드(Read)

**Files:**
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`
- Create: `src/app/(protected)/layout.tsx`, `src/app/(protected)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `getCurrentUser`, `logout`, UI 프리미티브.
- Produces: 홈 화면, 로그인 필요 영역 가드 + 상단 네비(로그아웃), `/dashboard`(내 정보 Read).

- [ ] **Step 1: 루트 레이아웃 메타데이터 정리**

Modify `src/app/layout.tsx` — `metadata`의 title/description을 보일러플레이트에 맞게 바꾼다(폰트/구조는 스캐폴딩 유지).
```tsx
export const metadata = {
  title: 'Next.js 보일러플레이트',
  description: '초보자용 풀스택 스타터 (인증 포함)',
}
```

- [ ] **Step 2: 홈 페이지**

Modify `src/app/page.tsx` (전체 교체):
```tsx
import Link from 'next/link'
import { getCurrentUser } from '@/features/users/queries'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-md space-y-6 p-8 text-center">
      <h1 className="text-2xl font-bold">Next.js 보일러플레이트</h1>
      <p className="text-gray-600">이메일/비밀번호 인증이 들어있는 풀스택 스타터</p>
      {user ? (
        <Link href="/dashboard">
          <Button>대시보드로 가기</Button>
        </Link>
      ) : (
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gray-700 hover:bg-gray-800">회원가입</Button>
          </Link>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: 보호 레이아웃(가드 + 네비)**

Create `src/app/(protected)/layout.tsx`:
```tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { logout } from '@/features/auth/actions'
import { Button } from '@/components/ui/Button'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 진짜 유저 검증(미들웨어는 쿠키 존재만 봤음). 없으면 로그인으로.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div>
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="font-medium hover:underline">대시보드</Link>
          <Link href="/settings" className="font-medium hover:underline">설정</Link>
        </div>
        <form action={logout}>
          <Button className="bg-gray-700 hover:bg-gray-800">로그아웃</Button>
        </form>
      </nav>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: 대시보드 페이지(Read)**

Create `src/app/(protected)/dashboard/page.tsx`:
```tsx
import { getCurrentUser } from '@/features/users/queries'

export default async function DashboardPage() {
  const user = await getCurrentUser() // 레이아웃이 null이 아님을 보장하지만, 타입 안전하게 옵셔널 처리
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-xl font-bold">대시보드</h1>
      <p>
        안녕하세요, <strong>{user?.name ?? user?.email}</strong> 님!
      </p>
      <ul className="text-sm text-gray-600">
        <li>이메일: {user?.email}</li>
        <li>가입일: {user?.createdAt.toLocaleDateString('ko-KR')}</li>
      </ul>
    </main>
  )
}
```

- [ ] **Step 5: 빌드 검증 + 커밋**

Run: `npm run build` (Expected: 에러 없음)
```bash
git add -A
git commit -m "feat: add home, protected layout guard, and dashboard"
```

---

### Task 13: 설정 화면 (Update / Delete)

**Files:**
- Create: `src/features/users/components/ProfileForm.tsx`, `ChangePasswordForm.tsx`, `DeleteAccountButton.tsx`
- Create: `src/app/(protected)/settings/page.tsx`

**Interfaces:**
- Consumes: `updateProfile`/`changePassword`/`deleteAccount` 액션, `getCurrentUser`, UI 프리미티브.
- Produces: `/settings`(이름 수정·비번 변경·회원 탈퇴).

- [ ] **Step 1: ProfileForm**

Create `src/features/users/components/ProfileForm.tsx`:
```tsx
'use client'
import { useActionState } from 'react'
import { updateProfile } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined)
  return (
    <form action={formAction} className="space-y-3">
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
      <div>
        <Label htmlFor="name">이름</Label>
        <Input id="name" name="name" type="text" defaultValue={defaultName} />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 2: ChangePasswordForm**

Create `src/features/users/components/ChangePasswordForm.tsx`:
```tsx
'use client'
import { useActionState } from 'react'
import { changePassword } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined)
  return (
    <form action={formAction} className="space-y-3">
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
      <div>
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required />
        <FieldError messages={state?.fieldErrors?.currentPassword} />
      </div>
      <div>
        <Label htmlFor="newPassword">새 비밀번호 (8자 이상)</Label>
        <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" required />
        <FieldError messages={state?.fieldErrors?.newPassword} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? '변경 중...' : '비밀번호 변경'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: DeleteAccountButton**

Create `src/features/users/components/DeleteAccountButton.tsx`:
```tsx
'use client'
import { deleteAccount } from '../actions'
import { Button } from '@/components/ui/Button'

export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (!confirm('정말 탈퇴하시겠어요? 되돌릴 수 없습니다.')) e.preventDefault()
      }}
    >
      <Button type="submit" className="bg-red-600 hover:bg-red-700">
        회원 탈퇴
      </Button>
    </form>
  )
}
```

- [ ] **Step 4: settings 페이지**

Create `src/app/(protected)/settings/page.tsx`:
```tsx
import { getCurrentUser } from '@/features/users/queries'
import { ProfileForm } from '@/features/users/components/ProfileForm'
import { ChangePasswordForm } from '@/features/users/components/ChangePasswordForm'
import { DeleteAccountButton } from '@/features/users/components/DeleteAccountButton'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-md space-y-8 p-8">
      <h1 className="text-xl font-bold">설정</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">프로필</h2>
        <ProfileForm defaultName={user?.name ?? ''} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">비밀번호 변경</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-red-700">위험 구역</h2>
        <DeleteAccountButton />
      </section>
    </main>
  )
}
```

- [ ] **Step 5: 빌드 검증 + 커밋**

Run: `npm run build` (Expected: 에러 없음)
```bash
git add -A
git commit -m "feat: add settings page (update profile, change password, delete account)"
```

---

## Phase 5 — 시드 · 문서 · 마무리

### Task 14: 시드 데이터 + 로그인 E2E 검증

**Files:**
- Create: `prisma/seed.ts`

**Interfaces:**
- Consumes: Prisma, bcryptjs.
- Produces: 데모 유저(`demo@example.com` / `password123`), `npm run db:seed` 동작.

- [ ] **Step 1: seed.ts 작성**

Create `prisma/seed.ts`:
```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)
  await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: '데모 유저', passwordHash },
  })
  console.log('✅ 데모 유저 준비 완료: demo@example.com / password123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

- [ ] **Step 2: 시드 실행**

Run: `npm run db:seed`
Expected: "데모 유저 준비 완료" 출력.

- [ ] **Step 3: 수동 E2E 검증(개발 서버)**

Run: `npm run dev` (별도 터미널), 브라우저로 확인:
- `/signup`에서 새 계정 생성 → `/dashboard`로 이동되나? (Create)
- 로그아웃 후 `/login`에서 `demo@example.com` / `password123` 로그인 → 대시보드 표시? (Read)
- `/settings`에서 이름 변경 → "저장되었습니다" + 대시보드 반영? (Update)
- 비로그인 상태로 `/dashboard` 직접 접근 → `/login`으로 리다이렉트?
- (선택) 회원 탈퇴 → 홈으로 이동, 재로그인 불가? (Delete)

Expected: 모든 항목 통과. 서버 종료 후 다음 단계.

- [ ] **Step 4: 커밋**

```bash
git add -A
git commit -m "feat: add demo user seed"
```

---

### Task 15: README (초보자 가이드)

**Files:**
- Modify: `README.md`(스캐폴딩 생성본 전체 교체)

**Interfaces:**
- Produces: 초보자가 따라할 수 있는 한국어 시작/구조/확장 가이드.

- [ ] **Step 1: README 작성**

`README.md`를 아래 내용으로 교체:
```markdown
# Next.js 보일러플레이트

초보자용 풀스택 스타터. 이메일/비밀번호 인증 + Prisma(SQLite) + 기능별 폴더 구조가 들어있어요.

## 빠른 시작

\`\`\`bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
npm run db:push           # DB(SQLite) 만들기
npm run db:seed           # 데모 계정 넣기
npm run dev               # http://localhost:3000
\`\`\`

데모 계정: **demo@example.com / password123**

> 운영 배포 전 `.env`의 `SESSION_SECRET`을 긴 랜덤값으로 바꾸세요.
> 예: \`node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"\`

## 폴더 구조

- \`src/app\` — 라우팅(화면만 얇게). \`(auth)\`=비로그인, \`(protected)\`=로그인 필요
- \`src/features/<도메인>\` — 기능별 로직(서버 액션·검증·세션·조회·컴포넌트)
- \`src/components/ui\` — 공용 UI(Button/Input/…)
- \`src/lib\` — 공용 인프라(prisma·env·utils·forms)
- \`prisma\` — DB 스키마(User 하나)와 시드

## 로그인은 어떻게 동작하나

1. 회원가입: 검증(zod) → 비번 해싱(bcryptjs) → User 생성 → 세션 쿠키 발급
2. 로그인: User 조회 → 비번 비교 → 서명된 JWT(jose)를 httpOnly 쿠키로 저장
3. 보호 페이지: \`middleware\`가 쿠키 확인 후, \`(protected)/layout\`이 실제 유저 검증
4. 로그아웃: 쿠키 삭제

관련 파일: \`src/features/auth/\`(actions·session·password·validation), \`src/middleware.ts\`

## 새 기능/모델 추가하는 법 (예: 게시글)

1. \`prisma/schema.prisma\`에 \`Post\` 모델 추가 → \`npm run db:push\`
2. \`src/features/posts/\` 폴더 생성: \`actions.ts\`·\`queries.ts\`·\`validation.ts\`·\`components/\`
3. \`src/app\`에 화면 추가(로직은 features에서 import)

## 자주 쓰는 명령어

| 명령 | 설명 |
|---|---|
| \`npm run dev\` | 개발 서버 |
| \`npm run build\` | 프로덕션 빌드 |
| \`npm run test\` | 테스트 |
| \`npm run db:studio\` | DB GUI |
| \`npm run db:reset\` | DB 초기화 후 재시드 |

## 배포 시 주의

- \`SESSION_SECRET\`을 반드시 교체
- DB를 Postgres로 바꾸려면 \`schema.prisma\`의 \`provider\`를 \`postgresql\`로, \`DATABASE_URL\`을 Postgres 주소로 변경 후 \`npm run db:push\`
```

(위 본문의 `\`\`\`` 및 `\`` 이스케이프는 실제 파일에선 보통의 백틱으로 작성한다.)

- [ ] **Step 2: 커밋**

```bash
git add -A
git commit -m "docs: add beginner-friendly README"
```

---

### Task 16: 최종 검증

**Files:** 없음(검증 전용)

- [ ] **Step 1: 포맷 + 린트**

Run: `npm run format && npm run lint`
Expected: 포맷 적용됨, 린트 에러 없음.

- [ ] **Step 2: 테스트 전체**

Run: `npm run test`
Expected: password(2) + validation(3) = 5 passed.

- [ ] **Step 3: 빌드**

Run: `npm run build`
Expected: 에러 없이 빌드 완료. 라우트 목록에 `/`, `/login`, `/signup`, `/dashboard`, `/settings` 표시.

- [ ] **Step 4: 변경분 있으면 커밋**

```bash
git add -A
git commit -m "chore: final format/lint pass" || echo "변경 없음"
```

- [ ] **Step 5: 완료 보고**

성공 기준(스펙 12장) 충족 여부를 정리해 보고한다.

---

## Self-Review 결과

- **스펙 커버리지:** 스택(Task1~6) · 폴더구조(전반) · User 스키마(Task2) · 인증흐름(Task6~9) · 화면/CRUD(Task11~13) · 환경변수(Task2~3) · 도구·스크립트(Task1,4) · README 7개 섹션(Task15) · 성공기준 검증(Task14,16) — 모두 대응됨.
- **플레이스홀더:** 모든 코드 단계에 실제 코드 포함, "TBD/적절히 처리" 없음.
- **타입 일관성:** `FormState`(error/success/fieldErrors)·`SessionPayload({userId})`·`getCurrentUser`(passwordHash 미포함 → changePassword에서 재조회) 등 작업 간 시그니처 일치 확인.
- **알려진 주의:** create-next-app 최신 버전 플래그/Turbopack 프롬프트 변동 가능 → Task1 검증 단계에서 흡수. zod는 v3 고정으로 `flatten()` API 안정.
