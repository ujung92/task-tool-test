'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { addComment } from '../actions'
import { Button } from '@/components/ui/Button'
import { FieldError } from '@/components/ui/FieldError'
import { Label } from '@/components/ui/Label'

export function CommentForm({ taskId }: { taskId: string }) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [state, formAction, pending] = useActionState(addComment, undefined)

  useEffect(() => {
    if (!state?.success) return
    formRef.current?.reset()
    router.refresh()
  }, [router, state?.success])

  return (
    <form ref={formRef} action={formAction} className="teamboard-comment-form">
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
