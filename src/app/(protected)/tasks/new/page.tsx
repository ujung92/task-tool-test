import { createTask } from '@/features/tasks/actions'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { getAssignableUsers } from '@/features/tasks/queries'

export default async function NewTaskPage() {
  const assignees = await getAssignableUsers()

  return (
    <main className="teamboard-page">
      <div className="teamboard-shell teamboard-task-shell">
        <section className="teamboard-task-hero">
          <div className="teamboard-task-hero-copy">
            <div className="teamboard-eyebrow">Task creation</div>
            <h1>Open a new workstream with clear ownership.</h1>
            <p>
              Capture the outcome, assign the owner, and place the task in the right execution
              lane without leaving the board rhythm.
            </p>
          </div>
        </section>

        <section className="teamboard-task-panel">
          <div className="teamboard-task-panel-head">
            <div>
              <h2>New Task</h2>
              <p>Create a team task with assignee, status, and supporting detail.</p>
            </div>
          </div>

          <TaskForm
            action={createTask}
            submitLabel="Create task"
            pendingLabel="Creating.."
            assignees={assignees}
          />
        </section>
      </div>
    </main>
  )
}
