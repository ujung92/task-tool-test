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
    <form action={formAction} className="teamboard-task-form">
      {defaultValues?.taskId ? <input type="hidden" name="taskId" value={defaultValues.taskId} /> : null}
      {state?.error ? <p className="teamboard-form-error">{state.error}</p> : null}
      {state?.success ? <p className="teamboard-form-success">{state.success}</p> : null}

      <div className="teamboard-form-field">
        <Label htmlFor="title">Title</Label>
        <Input id="title" name="title" defaultValue={defaultValues?.title ?? ''} required />
        <FieldError messages={state?.fieldErrors?.title} />
      </div>

      <div className="teamboard-form-field">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          defaultValue={defaultValues?.description ?? ''}
          rows={5}
          className="teamboard-form-textarea"
        />
        <FieldError messages={state?.fieldErrors?.description} />
      </div>

      <div className="teamboard-form-field">
        <Label htmlFor="assigneeId">Assignee</Label>
        <select
          id="assigneeId"
          name="assigneeId"
          defaultValue={defaultValues?.assigneeId ?? ''}
          className="teamboard-form-select"
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

      <div className="teamboard-form-field">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          defaultValue={defaultValues?.status ?? 'TODO'}
          className="teamboard-form-select"
        >
          <option value="TODO">To do</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="DONE">Done</option>
        </select>
        <FieldError messages={state?.fieldErrors?.status} />
      </div>

      <Button type="submit" disabled={pending} className="teamboard-form-button">
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  )
}
