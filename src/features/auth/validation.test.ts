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
