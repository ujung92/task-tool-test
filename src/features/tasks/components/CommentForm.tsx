'use client'

import { useActionState } from 'react'
import { addComment } from '../actions'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Label } from '@/components/ui/Label'

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addComment, undefined)

  return (
    <form action={formAction} className="teamboard-comment-form">
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error ? <p className="teamboard-form-error">{state.error}</p> : null}
      {state?.success ? <p className="teamboard-form-success">{state.success}</p> : null}

      <div className="teamboard-form-field">
        <Label htmlFor="body">Comment</Label>
        <textarea id="body" name="body" rows={4} className="teamboard-form-textarea" />
        <FieldError messages={state?.fieldErrors?.body} />
      </div>

      <Button type="submit" disabled={pending} className="teamboard-form-button">
        {pending ? 'Posting..' : 'Post comment'}
      </Button>
    </form>
  )
}
