type TaskCardProps = {
  onSelect: () => void
  task: {
    id: string
    status: 'TODO' | 'IN_PROGRESS' | 'DONE'
    title: string
    description: string | null
    completedAt: Date
    createdAt: Date
    author: { name: string | null; email: string }
    assignee: { name: string | null; email: string }
  }
}

export function TaskCard({ task, onSelect }: TaskCardProps) {
  const tone = task.status === 'TODO' ? 'todo' : task.status === 'IN_PROGRESS' ? 'progress' : 'done'

  return (
    <button type="button" onClick={onSelect} className={`teamboard-task-card ${tone}`}>
      <div className="teamboard-card-top">
        <span className={`teamboard-tag ${tone}`}>
          {task.status === 'TODO' ? 'To do' : task.status === 'IN_PROGRESS' ? 'In progress' : 'Done'}
        </span>
        <span className="teamboard-priority">{task.createdAt.toLocaleDateString('ko-KR')}</span>
      </div>

      <div className="space-y-2">
        <h3>{task.title}</h3>
        <p className="teamboard-card-description">{task.description || 'No description yet.'}</p>
        <dl className="teamboard-card-meta">
          <div>
            <dt className="inline font-medium">Assignee:</dt>{' '}
            <dd className="inline">{task.assignee.name ?? task.assignee.email}</dd>
          </div>
          <div>
            <dt className="inline font-medium">Author:</dt>{' '}
            <dd className="inline">{task.author.name ?? task.author.email}</dd>
          </div>
        </dl>
        <div className="teamboard-meta-row">
          <span>Complete by</span>
          <strong>{task.completedAt.toLocaleDateString('ko-KR')}</strong>
        </div>
      </div>
    </button>
  )
}
