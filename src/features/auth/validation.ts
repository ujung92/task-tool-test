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
