'use client'

import { deleteTask } from '../actions'
import { Button } from '@/components/ui/Button'

export function DeleteTaskButton({ taskId }: { taskId: string }) {
  return (
    <form
      action={deleteTask}
      onSubmit={(event) => {
        if (!confirm('Delete this task and all comments?')) {
          event.preventDefault()
        }
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <Button type="submit" className="teamboard-delete-button">
        Delete task
      </Button>
    </form>
  )
}
