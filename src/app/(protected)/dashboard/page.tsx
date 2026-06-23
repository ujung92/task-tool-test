import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import { getBoardTasks } from '@/features/tasks/queries'

export default async function DashboardPage() {
  const tasks = await getBoardTasks()

  return (
    <main className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Board</h1>
          <p className="text-sm text-gray-600">View all team tasks by status.</p>
        </div>
        <Link href="/tasks/new">
          <Button>New Task</Button>
        </Link>
      </div>

      <TaskBoard tasks={tasks} />
    </main>
  )
}
