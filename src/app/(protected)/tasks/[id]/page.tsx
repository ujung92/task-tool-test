import { notFound } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { updateTask } from '@/features/tasks/actions'
import { CommentForm } from '@/features/tasks/components/CommentForm'
import { DeleteTaskButton } from '@/features/tasks/components/DeleteTaskButton'
import { TaskForm } from '@/features/tasks/components/TaskForm'
import { canManageTask } from '@/features/tasks/permissions'
import { getAssignableUsers, getTaskDetail } from '@/features/tasks/queries'

type TaskDetailPageProps = {
  params: Promise<{ id: string }>
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params
  const [task, assignees, user] = await Promise.all([
    getTaskDetail(id),
    getAssignableUsers(),
    getCurrentUser(),
  ])

  if (!task || !user) notFound()

  const canManage = canManageTask(task, user.id)

  return (
    <main className="mx-auto max-w-3xl space-y-8 p-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <dl className="space-y-1 text-sm text-gray-600">
          <div>
            <dt className="inline font-medium">Status:</dt> <dd className="inline">{task.status}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Author:</dt>{' '}
            <dd className="inline">{task.author.name ?? task.author.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Assignee:</dt>{' '}
            <dd className="inline">{task.assignee.name ?? task.assignee.email}</dd>
          </div>
        </dl>
        <p className="rounded-md border bg-gray-50 p-4 text-sm whitespace-pre-wrap">
          {task.description || 'No description.'}
        </p>
      </section>

      {canManage ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Edit task</h2>
          <TaskForm
            action={updateTask}
            submitLabel="Save task"
            pendingLabel="Saving.."
            assignees={assignees}
            defaultValues={{
              taskId: task.id,
              title: task.title,
              description: task.description,
              status: task.status,
              assigneeId: task.assigneeId,
            }}
          />
          <DeleteTaskButton taskId={task.id} />
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Comments</h2>
        <div className="space-y-3">
          {task.comments.length ? (
            task.comments.map((comment) => (
              <article key={comment.id} className="rounded-md border p-3">
                <p className="text-sm whitespace-pre-wrap">{comment.body}</p>
                <p className="mt-2 text-xs text-gray-500">
                  {comment.author.name ?? comment.author.email} ·{' '}
                  {comment.createdAt.toLocaleString('ko-KR')}
                </p>
              </article>
            ))
          ) : (
            <p className="text-sm text-gray-500">No comments yet.</p>
          )}
        </div>
        <CommentForm taskId={task.id} />
      </section>
    </main>
  )
}
