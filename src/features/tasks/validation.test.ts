import { describe, expect, it } from 'vitest'
import { commentSchema, taskSchema } from './validation'

describe('taskSchema', () => {
  it('accepts a valid task payload', () => {
    const result = taskSchema.safeParse({
      title: 'Ship task board',
      description: 'Create board and detail pages',
      status: 'TODO',
      assigneeId: 'user_123',
      completedAt: '2026-06-23',
    })

    expect(result.success).toBe(true)
  })

  it('rejects blank title', () => {
    const result = taskSchema.safeParse({
      title: '   ',
      description: '',
      status: 'TODO',
      assigneeId: 'user_123',
      completedAt: '2026-06-23',
    })

    expect(result.success).toBe(false)
  })

  it('rejects unknown status', () => {
    const result = taskSchema.safeParse({
      title: 'Bad status',
      description: '',
      status: 'BLOCKED',
      assigneeId: 'user_123',
      completedAt: '2026-06-23',
    })

    expect(result.success).toBe(false)
  })

  it('rejects invalid completion date', () => {
    const result = taskSchema.safeParse({
      title: 'Bad date',
      description: '',
      status: 'TODO',
      assigneeId: 'user_123',
      completedAt: 'not-a-date',
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
