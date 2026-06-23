'use client'

import { useActionState } from 'react'
import type { FormState } from '@/lib/forms'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

type UserOption = { id: string; name: string | null; email: string }
type Action = (state: FormState, formData: FormData) => Promise<FormState>

type TaskFormProps = {
  action: Action
  submitLabel: string
  pendingLabel: string
  assignees: UserOption[]
  defaultValues?: {
    taskId?: string
    title?: string
    description?: string | null
    status?: 'TODO' | 'IN_PROGRESS' | 'DONE'
    assigneeId?: string
  }
}

export function TaskForm({
  action,
  submitLabel,
  pendingLabel,
  assignees,
  defaultValues,
}: TaskFormProps) {
  const [state, formAction, pending] = useActionState(action, undefined)

  return (
    <form action={formAction} className="space-y-4">
      {defaultValues?.taskId ? <input type="hidden" name="taskId" value={defaultValues.taskId} /> : null}
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-600">{state.success}</p> : null}

      <div>
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} required />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          rows={5}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div>
        <Label htmlFor="assigneeId">Assignee</Label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={defaultValues?.assigneeId ?? ''}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          required
        >
          <option value="" disabled>
            Select an assignee
          </option>
          {assignees.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name ?? user.email}
            </option>
          ))}
        </select>
        <FieldError messages={state?.fieldErrors?.assigneeId} />
      </div>

      <div>
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? 'TODO'}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        >
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
        <FieldError messages={state?.fieldErrors?.status} />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
