import Link from 'next/link'
import { getCurrentUser } from '@/features/users/queries'

const todoTasks = [
  {
    title: 'Executive dashboard redesign kickoff',
    description:
      'Finalize the new stakeholder-ready overview with denser KPI framing, richer visual hierarchy, and updated reporting tiles for weekly reviews.',
    tag: 'Backlog',
    priority: 'High priority',
    due: 'Due Friday · 09:00',
    owner: 'Owner: Product Design',
    count: '8 subtasks',
    members: ['AL', 'MK'],
  },
  {
    title: 'HTML-only agent rollout brief',
    description:
      'Document the single-file delivery flow for lightweight microsites and align the release checklist with faster approval loops for static deliverables.',
    tag: 'Planning',
    priority: 'Needs scope',
    due: 'Due Monday · 14:00',
    owner: 'Owner: Platform Ops',
    count: '5 subtasks',
    members: ['HN', 'SY'],
  },
]

const inProgressTasks = [
  {
    title: 'Responsive Teamboard single-page prototype',
    description:
      'Build a premium dark-mode static experience with hero narrative, hover-rich task cards, and responsive board behavior that opens directly in the browser.',
    tag: 'Active sprint',
    priority: 'In review',
    due: 'ETA today · 18:30',
    owner: 'Owner: Frontend Studio',
    count: '12 subtasks',
    members: ['CW', 'JS', 'QN'],
  },
  {
    title: 'Q3 launch sequencing review',
    description:
      'Reconcile engineering, marketing, and support milestones into one publishable timeline so dependencies surface before the final approval meeting.',
    tag: 'Coordination',
    priority: 'Cross-team',
    due: 'Next sync · 16:00',
    owner: 'Owner: Program Office',
    count: '3 blockers',
    members: ['DR', 'YL'],
  },
]

const doneTasks = [
  {
    title: 'Authentication baseline stabilization',
    description:
      'Hardened the protected route flow, cleaned validation paths, and established a dependable user session baseline for the next delivery wave.',
    tag: 'Delivered',
    priority: 'Signed off',
    due: 'Completed yesterday',
    owner: 'Owner: Core App',
    count: '0 open issues',
    members: ['KM', 'EC'],
  },
  {
    title: 'Seed dataset and status taxonomy alignment',
    description:
      'Unified sample data, delivery states, and ownership labels so demos and internal reviews now speak the same operational language.',
    tag: 'Closed',
    priority: 'Archived',
    due: 'Completed Monday',
    owner: 'Owner: Data Enablement',
    count: 'Retrospective ready',
    members: ['PT'],
  },
]

type Task = {
  title: string
  description: string
  tag: string
  priority: string
  due: string
  owner: string
  count: string
  members: string[]
}

function TaskColumn({
  title,
  tone,
  tasks,
}: {
  title: string
  tone: 'todo' | 'progress' | 'done'
  tasks: Task[]
}) {
  return (
    <section className="teamboard-column">
      <div className="teamboard-column-head">
        <div className="teamboard-column-label">
          <span className={`teamboard-status-dot ${tone}`} />
          <span>{title}</span>
        </div>
        <span className="teamboard-count-pill">{tasks.length}</span>
      </div>

      <div className="teamboard-card-stack">
        {tasks.map((task) => (
          <article key={task.title} className={`teamboard-task-card ${tone}`}>
            <div className="teamboard-card-top">
              <span className={`teamboard-tag ${tone}`}>{task.tag}</span>
              <span className="teamboard-priority">{task.priority}</span>
            </div>

            <h3>{task.title}</h3>
            <p>{task.description}</p>

            <div className="teamboard-card-meta">
              <div className="teamboard-meta-row">
                <span>{task.due}</span>
                <div className="teamboard-avatars">
                  {task.members.map((member) => (
                    <span key={member} className="teamboard-avatar">
                      {member}
                    </span>
                  ))}
                </div>
              </div>
              <div className="teamboard-meta-row">
                <span>{task.owner}</span>
                <span>{task.count}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default async function HomePage() {
  const user = await getCurrentUser()

  return (
    <main className="teamboard-page">
      <div className="teamboard-shell">
        <header className="teamboard-nav">
          <div className="teamboard-brand">
            <div className="teamboard-brand-badge">TB</div>
            <div className="teamboard-brand-copy">
              <strong>Teamboard</strong>
              <span>Executive task orchestration</span>
            </div>
          </div>

          <nav className="teamboard-nav-links">
            <a href="#hero">Overview</a>
            <a href="#board">Task Streams</a>
            <a href="#footer">Contact</a>
            <Link className="teamboard-nav-cta" href={user ? '/dashboard' : '/login'}>
              {user ? 'Open App' : 'Sign in'}
            </Link>
          </nav>
        </header>

        <section className="teamboard-hero" id="hero">
          <div className="teamboard-hero-content">
            <div className="teamboard-eyebrow">Featured workflow</div>
            <h1>Ship aligned work with a cinematic team board.</h1>
            <p>
              Teamboard brings strategic clarity to everyday execution. High-signal priorities,
              polished progress tracking, and decisive ownership all live in one immersive command
              surface designed for leaders and delivery teams.
            </p>

            <div className="teamboard-hero-actions">
              <a className="teamboard-button teamboard-button-primary" href="#board">
                Explore active board
              </a>
              <Link
                className="teamboard-button teamboard-button-secondary"
                href={user ? '/dashboard' : '/signup'}
              >
                {user ? 'Go to workspace' : 'Start with account'}
              </Link>
            </div>
          </div>
        </section>

        <section className="teamboard-section" id="board">
          <div className="teamboard-section-heading">
            <div>
              <h2>Task Streams</h2>
              <p>
                Each lane is tuned for quick scanning and richer decision context. Cards highlight
                ownership, scheduling, status, and delivery notes without losing visual calm.
              </p>
            </div>
            <div className="teamboard-meta">12 live initiatives · 3 delivery states</div>
          </div>

          <div className="teamboard-grid">
            <TaskColumn title="To do list" tone="todo" tasks={todoTasks} />
            <TaskColumn title="In progress list" tone="progress" tasks={inProgressTasks} />
            <TaskColumn title="Done list" tone="done" tasks={doneTasks} />
          </div>
        </section>

        <footer className="teamboard-footer" id="footer">
          <div>
            <strong>Teamboard</strong>
            <br />
            Premium task visibility for high-context delivery teams.
          </div>
          <div className="teamboard-footer-links">
            <a href="#hero">Hero</a>
            <a href="#board">Board</a>
            <a href="#footer">Footer</a>
          </div>
        </footer>
      </div>
    </main>
  )
}
