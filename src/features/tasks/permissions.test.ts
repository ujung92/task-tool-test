import { describe, expect, it } from 'vitest'
import { canManageTask } from './permissions'

describe('canManageTask', () => {
  const task = { authorId: 'author_1', assigneeId: 'assignee_1' }

  it('allows the author', () => {
    expect(canManageTask(task, 'author_1')).toBe(true)
  })

  it('allows the assignee', () => {
    expect(canManageTask(task, 'assignee_1')).toBe(true)
  })

  it('rejects other users', () => {
    expect(canManageTask(task, 'other_1')).toBe(false)
  })
})
