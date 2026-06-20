import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().max(50).optional(),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, '현재 비밀번호를 입력하세요'),
  newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
})
