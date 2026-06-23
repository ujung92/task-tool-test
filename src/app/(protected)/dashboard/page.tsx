import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { TaskBoard } from '@/features/tasks/components/TaskBoard'
import { getBoardTasks } from '@/features/tasks/queries'

export default async function DashboardPage() {
  const tasks = await getBoardTasks()
  const todoCount = tasks.filter((task) => task.status === 'TODO').length
  const inProgressCount = tasks.filter((task) => task.status === 'IN_PROGRESS').length
  const doneCount = tasks.filter((task) => task.status === 'DONE').length

  return (
    <main className="teamboard-page">
      <div className="teamboard-shell teamboard-dashboard-shell">
        <section className="teamboard-dashboard-hero">
          <div className="teamboard-dashboard-copy">
            <div className="teamboard-eyebrow">Operational view</div>
            <h1>Delivery board for the work that actually moves.</h1>
            <p>
              Scan priorities, unblock execution, and keep ownership visible across the team with
              one polished command surface.
            </p>
          </div>

          <div className="teamboard-dashboard-side">
            <div className="teamboard-dashboard-stats">
              <div className="teamboard-dashboard-stat">
                <span className="teamboard-dashboard-stat-label">To do</span>
                <strong>{todoCount}</strong>
              </div>
              <div className="teamboard-dashboard-stat">
                <span className="teamboard-dashboard-stat-label">In progress</span>
                <strong>{inProgressCount}</strong>
              </div>
              <div className="teamboard-dashboard-stat">
                <span className="teamboard-dashboard-stat-label">Done</span>
                <strong>{doneCount}</strong>
              </div>
            </div>
            <Link href="/tasks/new">
              <Button className="teamboard-dashboard-button">New Task</Button>
            </Link>
          </div>
        </section>

        <section className="teamboard-dashboard-board">
          <div className="teamboard-section-heading">
            <div>
              <h2>Team Board</h2>
              <p>
                Status lanes are tuned for quick review, richer delivery context, and cleaner
                handoff decisions.
              </p>
            </div>
            <div className="teamboard-meta">{tasks.length} active tasks - live shared board</div>
          </div>

          <TaskBoard tasks={tasks} />
        </section>
      </div>
    </main>
  )
}
