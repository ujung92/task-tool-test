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

  const parsed = updateProfileSchema.safeParse({
    name: (formData.get('name') as string) || undefined,
  })
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
