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
    <div className="grid gap-4 md:grid-cols-3">
      {columns.map((column) => {
        const columnTasks = tasks.filter((task) => task.status === column.key)

        return (
          <section key={column.key} className="space-y-3 rounded-md border bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">{column.title}</h2>
              <span className="text-sm text-gray-500">{columnTasks.length}</span>
            </div>
            <div className="space-y-3">
              {columnTasks.length ? (
                columnTasks.map((task) => <TaskCard key={task.id} task={task} />)
              ) : (
                <p className="text-sm text-gray-500">No tasks yet.</p>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
