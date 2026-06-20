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
