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
  // 참고: 실서비스에선 이메일이 없을 때도 더미 해시를 비교해 응답 시간을 맞추면 '가입 여부' 노출(타이밍 공격)을 막을 수 있다.
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
