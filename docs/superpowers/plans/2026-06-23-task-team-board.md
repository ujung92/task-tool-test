# Task Team Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a shared authenticated team task board with 3 status columns, task detail, task create/update/delete, and comments using the repo's existing Next.js + Prisma + Server Actions patterns.

**Architecture:** Extend the current `User`-only boilerplate with a small `tasks` feature module. Keep reads in server queries, writes in server actions, forms in feature components, and route files in `src/app` as thin shells. Use plain form submits and `revalidatePath()` instead of client-side state orchestration.

**Tech Stack:** Next.js 16 App Router, React 19, Prisma + SQLite, Zod, Server Actions, Vitest

---

## File Structure

Create:

- `src/features/tasks/validation.ts`
- `src/features/tasks/validation.test.ts`
- `src/features/tasks/permissions.ts`
- `src/features/tasks/permissions.test.ts`
- `src/features/tasks/queries.ts`
- `src/features/tasks/actions.ts`
- `src/features/tasks/components/TaskBoard.tsx`
- `src/features/tasks/components/TaskCard.tsx`
- `src/features/tasks/components/TaskForm.tsx`
- `src/features/tasks/components/DeleteTaskButton.tsx`
- `src/features/tasks/components/CommentForm.tsx`
- `src/app/(protected)/tasks/new/page.tsx`
- `src/app/(protected)/tasks/[id]/page.tsx`

Modify:

- `prisma/schema.prisma`
- `prisma/seed.ts`
- `src/app/(protected)/dashboard/page.tsx`
- `src/app/(protected)/layout.tsx`

Responsibilities:

- `validation.ts`: task/comment zod schemas and parsed field types
- `permissions.ts`: single-purpose author/assignee check
- `queries.ts`: board/detail/user option reads
- `actions.ts`: create/update/delete/comment mutations
- `components/*`: small forms and board rendering
- route files: load data and compose feature components

## Global Constraints

- Follow the existing `src/features/<domain>` structure. Do not add a generic repository/service layer.
- Before touching Next.js route or Server Action code, read the relevant guide under `node_modules/next/dist/docs/` for the specific API being changed.
- Reuse existing `FormState`, `Button`, `Input`, `Label`, and `FieldError`.
- Keep status changes in forms. Do not implement drag-and-drop.
- Any logged-in user may comment. Only author or assignee may edit/delete a task.

---

### Task 1: Lock Validation and Permission Rules with Tests

**Files:**

- Create: `src/features/tasks/validation.ts`
- Create: `src/features/tasks/validation.test.ts`
- Create: `src/features/tasks/permissions.ts`
- Create: `src/features/tasks/permissions.test.ts`
- Test: `src/features/tasks/validation.test.ts`, `src/features/tasks/permissions.test.ts`

- [ ] **Step 1: Read Next.js docs relevant to route params and Server Actions**

Run:

```powershell
Get-ChildItem 'node_modules/next/dist/docs' -Recurse -File | Select-String -Pattern 'Server Actions|route params|dynamic route'
```

Expected: file paths for the relevant Next 16 docs are listed. Read the matched docs before editing route or action code later in the plan.

- [ ] **Step 2: Write the failing validation tests**

Create `src/features/tasks/validation.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { commentSchema, taskSchema } from './validation'

describe('taskSchema', () => {
  it('accepts a valid task payload', () => {
    const result = taskSchema.safeParse({
      title: 'Ship task board',
      description: 'Create board and detail pages',
      status: 'TODO',
      assigneeId: 'user_123',
    })

    expect(result.success).toBe(true)
  })

  it('rejects blank title', () => {
    const result = taskSchema.safeParse({
      title: '   ',
      description: '',
      status: 'TODO',
      assigneeId: 'user_123',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown status', () => {
    const result = taskSchema.safeParse({
      title: 'Bad status',
      description: '',
      status: 'BLOCKED',
      assigneeId: 'user_123',
    })

    expect(result.success).toBe(false)
  })
})

describe('commentSchema', () => {
  it('accepts a trimmed comment body', () => {
    const result = commentSchema.safeParse({ body: 'Looks good' })
    expect(result.success).toBe(true)
  })

  it('rejects empty comment body', () => {
    const result = commentSchema.safeParse({ body: '   ' })
    expect(result.success).toBe(false)
  })
})
```

Create `src/features/tasks/permissions.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { canManageTask } from './permissions'

describe('canManageTask', () => {
  const task = { authorId: 'author_1', assigneeId: 'assignee_1' }

  it('allows the author', () => {
    expect(canManageTask(task, 'author_1')).toBe(true)
  })

  it('allows the assignee', () => {
    expect(canManageTask(task, 'assignee_1')).toBe(true)
  })

  it('rejects other users', () => {
    expect(canManageTask(task, 'other_1')).toBe(false)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npx vitest run src/features/tasks/validation.test.ts src/features/tasks/permissions.test.ts
```

Expected: FAIL because `./validation` and `./permissions` do not exist yet.

- [ ] **Step 4: Write the minimal validation and permission code**

Create `src/features/tasks/validation.ts`:

```ts
import { z } from 'zod'

export const taskStatusValues = ['TODO', 'IN_PROGRESS', 'DONE'] as const

export const taskSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, '제목을 입력해 주세요.')
    .max(100, '제목은 100자 이하로 입력해 주세요.'),
  description: z
    .string()
    .trim()
    .max(2000, '설명은 2000자 이하로 입력해 주세요.')
    .optional()
    .transform((value) => value || undefined),
  status: z.enum(taskStatusValues),
  assigneeId: z.string().min(1, '담당자를 선택해 주세요.'),
})

export const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, '코멘트를 입력해 주세요.')
    .max(1000, '코멘트는 1000자 이하로 입력해 주세요.'),
})
```

Create `src/features/tasks/permissions.ts`:

```ts
type ManagedTask = { authorId: string; assigneeId: string }

export function canManageTask(task: ManagedTask, userId: string) {
  return task.authorId === userId || task.assigneeId === userId
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npx vitest run src/features/tasks/validation.test.ts src/features/tasks/permissions.test.ts
```

Expected: PASS with 8 assertions passing.

- [ ] **Step 6: Commit**

```bash
git add src/features/tasks/validation.ts src/features/tasks/validation.test.ts src/features/tasks/permissions.ts src/features/tasks/permissions.test.ts
git commit -m "feat: add task validation and permission rules"
```

---

### Task 2: Add Prisma Models and Seed Data for Tasks

**Files:**

- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Write the schema change in Prisma**

Modify `prisma/schema.prisma` by extending `User` and adding `Task`, `Comment`, and `TaskStatus`:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  passwordHash  String
  name          String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  tasksAuthored Task[]    @relation("TaskAuthor")
  tasksAssigned Task[]    @relation("TaskAssignee")
  comments      Comment[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  authorId    String
  assigneeId  String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  author      User       @relation("TaskAuthor", fields: [authorId], references: [id])
  assignee    User       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  taskId    String
  authorId  String
  createdAt DateTime @default(now())
  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

- [ ] **Step 2: Apply the schema and regenerate Prisma client**

Run:

```bash
npm run db:push
```

Expected: PASS with "Your database is now in sync with your Prisma schema".

- [ ] **Step 3: Extend the seed to create one extra user and a sample task**

Modify `prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User', passwordHash },
  })

  const teammate = await prisma.user.upsert({
    where: { email: 'teammate@example.com' },
    update: {},
    create: { email: 'teammate@example.com', name: 'Teammate', passwordHash },
  })

  await prisma.task.upsert({
    where: { id: 'seed-task-team-board' },
    update: {},
    create: {
      id: 'seed-task-team-board',
      title: 'Task board sample',
      description: 'Seed task for verifying the board layout.',
      status: 'TODO',
      authorId: demoUser.id,
      assigneeId: teammate.id,
    },
  })
}
```

- [ ] **Step 4: Run the seed and verify it succeeds**

Run:

```bash
npm run db:seed
```

Expected: PASS with no Prisma errors.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts
git commit -m "feat: add Prisma task and comment models"
```

---

### Task 3: Implement Task Queries and Server Actions

**Files:**

- Create: `src/features/tasks/queries.ts`
- Create: `src/features/tasks/actions.ts`
- Modify: `src/features/tasks/permissions.ts`
- Test: `src/features/tasks/permissions.test.ts`

- [ ] **Step 1: Add the board/detail/user query functions**

Create `src/features/tasks/queries.ts`:

```ts
import 'server-only'
import { prisma } from '@/lib/prisma'

export async function getBoardTasks() {
  return prisma.task.findMany({
    orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
    },
  })
}

export async function getTaskDetail(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      comments: {
        orderBy: { createdAt: 'asc' },
        include: { author: { select: { id: true, name: true, email: true } } },
      },
    },
  })
}

export async function getAssignableUsers() {
  return prisma.user.findMany({
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    select: { id: true, name: true, email: true },
  })
}
```

- [ ] **Step 2: Expand the permission helper type so actions can reuse it cleanly**

Modify `src/features/tasks/permissions.ts`:

```ts
export type ManagedTask = {
  authorId: string
  assigneeId: string
}

export function canManageTask(task: ManagedTask, userId: string) {
  return task.authorId === userId || task.assigneeId === userId
}
```

- [ ] **Step 3: Write the server actions with the shared FormState pattern**

Create `src/features/tasks/actions.ts`:

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { FormState } from '@/lib/forms'
import { getCurrentUser } from '@/features/users/queries'
import { canManageTask } from './permissions'
import { commentSchema, taskSchema } from './validation'

export async function createTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    status: formData.get('status'),
    assigneeId: formData.get('assigneeId'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const task = await prisma.task.create({
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
      authorId: user.id,
    },
  })

  revalidatePath('/dashboard')
  redirect(`/tasks/${task.id}`)
}

export async function updateTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const taskId = String(formData.get('taskId'))
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, authorId: true, assigneeId: true },
  })

  if (!existingTask || !canManageTask(existingTask, user.id)) {
    return { error: '이 task를 수정할 권한이 없습니다.' }
  }

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    status: formData.get('status'),
    assigneeId: formData.get('assigneeId'),
  })

  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
    },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${taskId}`)
  return { success: 'Task가 저장되었습니다.' }
}

export async function deleteTask(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const taskId = String(formData.get('taskId'))
  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, authorId: true, assigneeId: true },
  })

  if (!existingTask || !canManageTask(existingTask, user.id)) {
    redirect('/dashboard')
  }

  await prisma.task.delete({ where: { id: taskId } })

  revalidatePath('/dashboard')
  redirect('/dashboard')
}

export async function addComment(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const taskId = String(formData.get('taskId'))
  const parsed = commentSchema.safeParse({ body: formData.get('body') })
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors }

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  })

  if (!existingTask) return { error: 'Task를 찾을 수 없습니다.' }

  await prisma.comment.create({
    data: { taskId, authorId: user.id, body: parsed.data.body },
  })

  revalidatePath(`/tasks/${taskId}`)
  return { success: '코멘트가 추가되었습니다.' }
}
```

- [ ] **Step 4: Run type-check and task tests**

Run:

```bash
npx tsc --noEmit
npx vitest run src/features/tasks/validation.test.ts src/features/tasks/permissions.test.ts
```

Expected: PASS with no TypeScript errors and task tests still green.

- [ ] **Step 5: Commit**

```bash
git add src/features/tasks/queries.ts src/features/tasks/actions.ts src/features/tasks/permissions.ts
git commit -m "feat: add task queries and server actions"
```

---

### Task 4: Build the Board and Task Detail UI

**Files:**

- Create: `src/features/tasks/components/TaskBoard.tsx`
- Create: `src/features/tasks/components/TaskCard.tsx`
- Create: `src/features/tasks/components/TaskForm.tsx`
- Create: `src/features/tasks/components/DeleteTaskButton.tsx`
- Create: `src/features/tasks/components/CommentForm.tsx`
- Modify: `src/app/(protected)/dashboard/page.tsx`
- Create: `src/app/(protected)/tasks/new/page.tsx`
- Create: `src/app/(protected)/tasks/[id]/page.tsx`

- [ ] **Step 1: Create the card and board components**

Create `src/features/tasks/components/TaskCard.tsx`:

```tsx
import Link from 'next/link'

type TaskCardProps = {
  task: {
    id: string
    title: string
    createdAt: Date
    author: { name: string | null; email: string }
    assignee: { name: string | null; email: string }
  }
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="block rounded border bg-white p-3 shadow-sm hover:border-gray-400"
    >
      <div className="space-y-2">
        <h3 className="font-medium">{task.title}</h3>
        <dl className="space-y-1 text-xs text-gray-600">
          <div>
            <dt className="inline font-medium">담당자:</dt>{' '}
            <dd className="inline">{task.assignee.name ?? task.assignee.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">등록자:</dt>{' '}
            <dd className="inline">{task.author.name ?? task.author.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">생성일:</dt>{' '}
            <dd className="inline">{task.createdAt.toLocaleDateString('ko-KR')}</dd>
          </div>
        </dl>
      </div>
    </Link>
  )
}
```

Create `src/features/tasks/components/TaskBoard.tsx`:

```tsx
import { TaskCard } from './TaskCard'

const columns = [
  { key: 'TODO', title: '대기' },
  { key: 'IN_PROGRESS', title: '진행' },
  { key: 'DONE', title: '완료' },
] as const

type BoardTask = {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  createdAt: Date
  author: { name: string | null; email: string }
  assignee: { name: string | null; email: string }
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key)
        return (
          <section key={column.key} className="space-y-3 rounded border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{column.title}</h2>
              <span className="text-sm text-gray-500">{columnTasks.length}</span>
            </div>
            <div className="space-y-3">
              {columnTasks.length ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <p className="text-sm text-gray-500">Task가 없습니다.</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Create the task form, delete button, and comment form**

Create `src/features/tasks/components/TaskForm.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import type { FormState } from '@/lib/forms'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

type UserOption = { id: string; name: string | null; email: string }
type Action = (state: FormState, formData: FormData) => Promise<FormState>

type TaskFormProps = {
  action: Action
  submitLabel: string
  pendingLabel: string
  assignees: UserOption[]
  defaultValues?: {
    taskId?: string
    title?: string
    description?: string | null
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
    assigneeId?: string
  }
}

export function TaskForm({
  action,
  submitLabel,
  pendingLabel,
  assignees,
  defaultValues,
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.taskId ? (
        <input type="hidden" name="taskId" value={defaultValues.taskId} />
      ) : null}
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

      <div>
        <Label htmlFor="title">제목</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} required />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          rows={5}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div>
        <Label htmlFor="assigneeId">담당자</Label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={defaultValues?.assigneeId ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
          required
        >
          <option value="" disabled>
            담당자를 선택해 주세요
          </option>
          {assignees.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </select>
        <FieldError messages={state?.fieldErrors?.assigneeId} />
      </div>

      <div>
        <Label htmlFor="status">상태</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? 'TODO'}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="TODO">대기</option>
          <option value="IN_PROGRESS">진행</option>
          <option value="DONE">완료</option>
        </select>
        <FieldError messages={state?.fieldErrors?.status} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
```

Create `src/features/tasks/components/DeleteTaskButton.tsx`:

```tsx
'use client'

import { deleteTask } from '../actions'
import { Button } from '@/components/ui/Button'

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  return (
    <form
      action={deleteTask}
      onSubmit={(event) => {
        if (!confirm('정말 이 task를 삭제할까요? 코멘트도 함께 삭제됩니다.')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <Button type="submit" className="bg-red-600 hover:bg-red-700">
        Task 삭제
      </Button>
    </form>
  )
}
```

Create `src/features/tasks/components/CommentForm.tsx`:

```tsx
'use client'

import { useActionState } from 'react'
import { addComment } from '../actions'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Label } from '@/components/ui/Label'

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addComment, undefined)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <div>
        <Label htmlFor="body">코멘트</Label>
        <textarea
          id="body"
          name="body"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
        <FieldError messages={state?.fieldErrors?.body} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? '등록 중..' : '코멘트 등록'}
      </Button>
    </form>
  )
}
```

- [ ] **Step 3: Replace dashboard with the shared task board**

Modify `src/app/(protected)/dashboard/page.tsx`:

```tsx
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import { getBoardTasks } from '@/features/tasks/queries'

export default async function DashboardPage() {
  const tasks = await getBoardTasks()

  return (
    <main className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">팀 보드</h1>
          <p className="text-sm text-gray-600">팀 전체 task를 상태별로 확인합니다.</p>
        </div>
        <Link href="/tasks/new">
          <Button>새 Task</Button>
        </Link>
      </div>

      <TaskBoard tasks={tasks} />
    </main>
  )
}
```

- [ ] **Step 4: Add the create page and task detail page**

Create `src/app/(protected)/tasks/new/page.tsx`:

```tsx
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { createTask } from '@/features/tasks/actions'
import { getAssignableUsers } from '@/features/tasks/queries'

export default async function NewTaskPage() {
  const assignees = await getAssignableUsers()

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">새 Task</h1>
        <p className="text-sm text-gray-600">등록자와 담당자를 기반으로 팀 작업을 추가합니다.</p>
      </div>
      <TaskForm
        action={createTask}
        submitLabel="Task 생성"
        pendingLabel="생성 중.."
        assignees={assignees}
      />
    </main>
  )
}
```

Create `src/app/(protected)/tasks/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { updateTask } from '@/features/tasks/actions'
import { CommentForm } from '@/features/tasks/components/CommentForm'
import { DeleteTaskButton } from '@/features/tasks/components/DeleteTaskButton'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { canManageTask } from '@/features/tasks/permissions'
import { getAssignableUsers, getTaskDetail } from '@/features/tasks/queries'

type TaskDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params
  const [task, assignees, user] = await Promise.all([
    getTaskDetail(id),
    getAssignableUsers(),
    getCurrentUser(),
  ])

  if (!task || !user) notFound()

  const canManage = canManageTask(task, user.id)

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <dl className="space-y-1 text-sm text-gray-600">
          <div>
            <dt className="inline font-medium">상태:</dt> <dd className="inline">{task.status}</dd>
          </div>
          <div>
            <dt className="inline font-medium">등록자:</dt>{' '}
            <dd className="inline">{task.author.name ?? task.author.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">담당자:</dt>{' '}
            <dd className="inline">{task.assignee.name ?? task.assignee.email}</dd>
          </div>
        </dl>
        <p className="rounded border bg-gray-50 p-4 text-sm whitespace-pre-wrap">
          {task.description || '설명이 없습니다.'}
        </p>
      </section>

      {canManage ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Task 수정</h2>
          <TaskForm
            action={updateTask}
            submitLabel="Task 저장"
            pendingLabel="저장 중.."
            assignees={assignees}
            defaultValues={{
              taskId: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              assigneeId: task.assigneeId,
            }}
          />
          <DeleteTaskButton taskId={task.id} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">코멘트</h2>
        <div className="space-y-3">
          {task.comments.length ? (
            task.comments.map((comment) => (
              <article key={comment.id} className="rounded border p-3">
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {comment.author.name ?? comment.author.email} ·{' '}
                  {comment.createdAt.toLocaleString('ko-KR')}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-gray-500">아직 코멘트가 없습니다.</p>
          )}
        </div>
        <CommentForm taskId={task.id} />
      </section>
    </main>
  )
}
```

- [ ] **Step 5: Run build to catch route and Server Action issues**

Run:

```bash
npm run build
```

Expected: PASS with `/dashboard`, `/tasks/new`, and `/tasks/[id]` included in the route output.

- [ ] **Step 6: Commit**

```bash
git add src/features/tasks/components src/app/(protected)/dashboard/page.tsx src/app/(protected)/tasks/new/page.tsx src/app/(protected)/tasks/[id]/page.tsx
git commit -m "feat: add task board and detail pages"
```

---

### Task 5: Finish Navigation and Protected Layout Integration

**Files:**

- Modify: `src/app/(protected)/layout.tsx`

- [ ] **Step 1: Add a direct tasks navigation label in the protected nav**

Modify the nav block in `src/app/(protected)/layout.tsx`:

```tsx
<div className="flex gap-4 text-sm">
  <Link href="/dashboard" className="font-medium hover:underline">
    팀 보드
  </Link>
  <Link href="/settings" className="font-medium hover:underline">
    설정
  </Link>
</div>
```

- [ ] **Step 2: Run lint and build**

Run:

```bash
npm run lint
npm run build
```

Expected: PASS with no lint or build errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/(protected)/layout.tsx
git commit -m "feat: update protected navigation for team board"
```

---

### Task 6: End-to-End Verification and Cleanup

**Files:** none required unless fixes are discovered during verification

- [ ] **Step 1: Run focused automated checks**

Run:

```bash
npm run test
npx tsc --noEmit
npm run build
```

Expected:

- `npm run test`: PASS including existing auth tests and new task tests
- `npx tsc --noEmit`: PASS
- `npm run build`: PASS

- [ ] **Step 2: Run the app and do a short manual workflow**

Run:

```bash
npm run dev
```

Verify manually in the browser:

- log in as `demo@example.com / password123`
- confirm `/dashboard` shows 3 board columns
- create a task assigned to `teammate@example.com`
- open the task detail page
- update its status from `TODO` to `IN_PROGRESS`
- add a comment while logged in
- confirm delete is visible for author/assignee

Expected: all flows succeed without navigation errors or broken forms.

- [ ] **Step 3: Format if needed and commit any verification fixes**

Run:

```bash
npm run format
git add -A
git commit -m "chore: finalize task team board" || echo "No verification fixes"
```

- [ ] **Step 4: Summarize the shipped surface**

Record in the implementation handoff that the delivered feature includes:

```text
- shared 3-column team board
- task create/update/delete with author/assignee permissions
- task detail page
- comment creation for any logged-in user
- validation, permission, type-check, and build coverage
```

---

## Self-Review

- **Spec coverage:** board, task detail, comment creation, author/assignee update/delete rules, validation, and revalidation flow all map to Tasks 1 through 6. No spec section is orphaned.
- **Placeholder scan:** no `TBD`, no generic "add tests later", and each code-writing step includes concrete code or command content.
- **Type consistency:** task status values are `TODO | IN_PROGRESS | DONE` throughout; `canManageTask` uses `authorId` and `assigneeId` consistently; `TaskForm` hidden `taskId` matches `updateTask`.
