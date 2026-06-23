import { TaskCard } from './TaskCard'

const columns = [
  { key: 'TODO', title: 'To do' },
  { key: 'IN_PROGRESS', title: 'In progress' },
  { key: 'DONE', title: 'Done' },
] as const

type BoardTask = {
  id: string
  title: string
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  createdAt: Date
  author: { name: string | null; email: string }
  assignee: { name: string | null; email: string }
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  return (
    <div className="teamboard-grid">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key)
        const tone =
          column.key === 'TODO' ? 'todo' : column.key === 'IN_PROGRESS' ? 'progress' : 'done'

        return (
          <section key={column.key} className="teamboard-column">
            <div className="teamboard-column-head">
              <div className="teamboard-column-label">
                <span className={`teamboard-status-dot ${tone}`} />
                <h2>{column.title}</h2>
              </div>
              <span className="teamboard-count-pill">{columnTasks.length}</span>
            </div>

            <div className="teamboard-card-stack">
              {columnTasks.length ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <p className="teamboard-empty-state">No tasks yet.</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
