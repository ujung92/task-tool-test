export type ManagedTask = {
  authorId: string
  assigneeId: string
}

export function canManageTask(task: ManagedTask, userId: string) {
  return task.authorId === userId || task.assigneeId === userId
}
