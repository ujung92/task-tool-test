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
    <main className="teamboard-page">
      <div className="teamboard-shell teamboard-task-shell">
        <section className="teamboard-task-hero">
          <div className="teamboard-task-hero-copy">
            <div className="teamboard-eyebrow">Task detail</div>
            <h1>{task.title}</h1>
            <p>{task.description || 'No description.'}</p>
          </div>

          <div className="teamboard-task-summary">
            <div className="teamboard-task-summary-item">
              <span>Status</span>
              <strong>{task.status}</strong>
            </div>
            <div className="teamboard-task-summary-item">
              <span>Author</span>
              <strong>{task.author.name ?? task.author.email}</strong>
            </div>
            <div className="teamboard-task-summary-item">
              <span>Assignee</span>
              <strong>{task.assignee.name ?? task.assignee.email}</strong>
            </div>
            <div className="teamboard-task-summary-item">
              <span>Completion date</span>
              <strong>{task.completedAt.toLocaleDateString('ko-KR')}</strong>
            </div>
          </div>
        </section>

        {canManage ? (
          <section className="teamboard-task-panel">
            <div className="teamboard-task-panel-head">
              <div>
                <h2>Edit task</h2>
                <p>Adjust ownership, detail, and execution status in the same premium workspace.</p>
              </div>
            </div>

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
                completedAt: task.completedAt,
              }}
            />

            <div className="teamboard-task-danger">
              <DeleteTaskButton taskId={task.id} />
            </div>
          </section>
        ) : null}

        <section className="teamboard-task-panel">
          <div className="teamboard-task-panel-head">
            <div>
              <h2>Comments</h2>
              <p>Keep delivery context, decisions, and progress notes visible on the task itself.</p>
            </div>
          </div>

          <div className="teamboard-comment-list">
            {task.comments.length ? (
              task.comments.map((comment) => (
                <article key={comment.id} className="teamboard-comment-card">
                  <p>{comment.body}</p>
                  <div className="teamboard-comment-meta">
                    <span>{comment.author.name ?? comment.author.email}</span>
                    <span>{comment.createdAt.toLocaleString('ko-KR')}</span>
                  </div>
                </article>
              ))
            ) : (
              <p className="teamboard-empty-state">No comments yet.</p>
            )}
          </div>

          <CommentForm taskId={task.id} />
        </section>
      </div>
    </main>
  )
}
