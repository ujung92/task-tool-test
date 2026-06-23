'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { CommentForm } from './CommentForm'
import { TaskCard } from './TaskCard'

const columns = [
  { key: 'TODO', title: 'To do' },
  { key: 'IN_PROGRESS', title: 'In progress' },
  { key: 'DONE', title: 'Done' },
] as const

type BoardTask = {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'DONE'
  completedAt: Date
  createdAt: Date
  author: { name: string | null; email: string }
  assignee: { name: string | null; email: string }
  comments: Array<{
    id: string
    body: string
    createdAt: Date
    author: { name: string | null; email: string }
  }>
}

export function TaskBoard({ tasks }: { tasks: BoardTask[] }) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  )

  return (
    <>
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
                  columnTasks.map((task) => (
                    <TaskCard key={task.id} task={task} onSelect={() => setSelectedTaskId(task.id)} />
                  ))
                ) : (
                  <p className="teamboard-empty-state">No tasks yet.</p>
                )}
              </div>
            </section>
          )
        })}
      </div>

      {selectedTask ? (
        <div
          className="teamboard-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="teamboard-modal-title"
          onClick={() => setSelectedTaskId(null)}
        >
          <div className="teamboard-modal" onClick={(event) => event.stopPropagation()}>
            <div className="teamboard-modal-head">
              <div>
                <div className="teamboard-eyebrow">Task detail</div>
                <h3 id="teamboard-modal-title">{selectedTask.title}</h3>
              </div>
              <button
                type="button"
                className="teamboard-modal-close"
                onClick={() => setSelectedTaskId(null)}
                aria-label="Close task detail"
              >
                ×
              </button>
            </div>

            <div className="teamboard-modal-summary">
              <div>
                <span>Status</span>
                <strong>
                  {selectedTask.status === 'TODO'
                    ? 'To do'
                    : selectedTask.status === 'IN_PROGRESS'
                      ? 'In progress'
                      : 'Done'}
                </strong>
              </div>
              <div>
                <span>Author</span>
                <strong>{selectedTask.author.name ?? selectedTask.author.email}</strong>
              </div>
              <div>
                <span>Assignee</span>
                <strong>{selectedTask.assignee.name ?? selectedTask.assignee.email}</strong>
              </div>
              <div>
                <span>Completion date</span>
                <strong>{selectedTask.completedAt.toLocaleDateString('ko-KR')}</strong>
              </div>
            </div>

            <div className="teamboard-modal-body">
              <section className="teamboard-task-panel">
                <div className="teamboard-task-panel-head">
                  <div>
                    <h2>Description</h2>
                    <p>Keep delivery context directly on the board.</p>
                  </div>
                  <Link href={`/tasks/${selectedTask.id}`} className="teamboard-modal-link">
                    Open full page
                  </Link>
                </div>
                <p className="teamboard-modal-description">
                  {selectedTask.description || 'No description yet.'}
                </p>
              </section>

              <section className="teamboard-task-panel">
                <div className="teamboard-task-panel-head">
                  <div>
                    <h2>Comments</h2>
                    <p>Add context without leaving the dashboard.</p>
                  </div>
                </div>

                <div className="teamboard-comment-list">
                  {selectedTask.comments.length ? (
                    selectedTask.comments.map((comment) => (
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

                <CommentForm taskId={selectedTask.id} />
              </section>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
