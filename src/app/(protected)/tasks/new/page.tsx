import { createTask } from '@/features/tasks/actions'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { getAssignableUsers } from '@/features/tasks/queries'

export default async function NewTaskPage() {
  const assignees = await getAssignableUsers()

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold">New Task</h1>
        <p className="text-sm text-gray-600">Create a team task with an assignee.</p>
      </div>
      <TaskForm
        action={createTask}
        submitLabel="Create task"
        pendingLabel="Creating.."
        assignees={assignees}
      />
    </main>
  )
}
