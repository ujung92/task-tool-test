import Link from 'next/link'

type TaskCardProps = {
  task: {
    id: string
    title: string
    createdAt: Date
    author: { name: string | null; email: string }
    assignee: { name: string | null; email: string }
  }
}

export function TaskCard({ task }: TaskCardProps) {
  return (
    <Link href={`/tasks/${task.id}`} className="teamboard-task-card">
      <div className="teamboard-card-top">
        <span className="teamboard-card-badge">Task</span>
        <span className="teamboard-priority">{task.createdAt.toLocaleDateString('ko-KR')}</span>
      </div>

      <div className="space-y-2">
        <h3>{task.title}</h3>
        <dl className="teamboard-card-meta">
          <div>
            <dt className="inline font-medium">Assignee:</dt> <dd className="inline">{task.assignee.name ?? task.assignee.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Author:</dt> <dd className="inline">{task.author.name ?? task.author.email}</dd>
          </div>
        </dl>
      </div>
    </Link>
  )
}
