'use client'

import { useActionState } from 'react'
import { addComment } from '../actions'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Label } from '@/components/ui/Label'

export function CommentForm({ taskId }: { taskId: string }) {
  const [state, formAction, pending] = useActionState(addComment, undefined)

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="taskId" value={taskId} />
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-600">{state.success}</p> : null}
      <div>
        <Label htmlFor="body">Comment</Label>
        <textarea
          id="body"
          name="body"
          rows={4}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        <FieldError messages={state?.fieldErrors?.body} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? 'Posting..' : 'Post comment'}
      </Button>
    </form>
  )
}
