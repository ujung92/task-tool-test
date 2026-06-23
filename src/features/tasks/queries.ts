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
        include: {
          author: { select: { id: true, name: true, email: true } },
        },
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
