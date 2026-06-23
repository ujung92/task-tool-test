import { z } from 'zod'

export const taskStatusValues = ['TODO', 'IN_PROGRESS', 'DONE'] as const

export const taskSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(100, 'Title must be 100 chars or fewer.'),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must be 2000 chars or fewer.')
    .optional()
    .transform((value) => value || undefined),
  status: z.enum(taskStatusValues),
  assigneeId: z.string().min(1, 'Select an assignee.'),
})

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Enter a comment.').max(1000, 'Comment must be 1000 chars or fewer.'),
})
