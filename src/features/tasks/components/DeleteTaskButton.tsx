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
      <Button type="submit" className="bg-red-600 hover:bg-red-700">
        Delete task
      </Button>
    </form>
  )
}
