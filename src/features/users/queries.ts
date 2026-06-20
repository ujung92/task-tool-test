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
