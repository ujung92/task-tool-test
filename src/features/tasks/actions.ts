'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { FormState } from '@/lib/forms'
import { getCurrentUser } from '@/features/users/queries'
import { notifyTaskEvent } from '@/lib/slack'
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
    completedAt: formData.get('completedAt'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.task.create({
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
      authorId: user.id,
    },
  })

  await notifyTaskEvent('created', parsed.data.title, user.name ?? user.email)

  revalidatePath('/dashboard')
  redirect('/dashboard')
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
    return { error: 'You do not have permission to edit this task.' }
  }

  const parsed = taskSchema.safeParse({
    title: formData.get('title'),
    description: (formData.get('description') as string) || undefined,
    status: formData.get('status'),
    assigneeId: formData.get('assigneeId'),
    completedAt: formData.get('completedAt'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  await prisma.task.update({
    where: { id: taskId },
    data: {
      ...parsed.data,
      description: parsed.data.description ?? null,
    },
  })

  await notifyTaskEvent('updated', parsed.data.title, user.name ?? user.email)

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${taskId}`)
  return { success: 'Task saved.' }
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

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const existingTask = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  })

  if (!existingTask) {
    return { error: 'Task not found.' }
  }

  await prisma.comment.create({
    data: { taskId, authorId: user.id, body: parsed.data.body },
  })

  revalidatePath('/dashboard')
  revalidatePath(`/tasks/${taskId}`)
  return { success: 'Comment added.' }
}
