# Task Team Board Design

- Date: 2026-06-23
- Status: Drafted for implementation planning

## 1. Goal

Add a minimal team task board on top of the existing authenticated boilerplate.

The feature should let logged-in users:

- view all tasks on a shared team board
- create tasks with an author and assignee
- track status through `TODO -> IN_PROGRESS -> DONE`
- open a task detail page
- add comments to a task

This first version should stay deliberately small. It should satisfy the workflow without drag-and-drop, realtime sync, advanced filtering, or extra role systems.

## 2. Agreed Scope

The user-facing scope is:

- shared team board for all logged-in users
- board grouped into 3 status columns
- task detail page with comments
- any logged-in user can add comments
- only the task author or assignee can update or delete the task

Out of scope for this version:

- drag-and-drop status changes
- comment edit/delete
- attachments
- multiple assignees
- search, sort, saved filters
- notifications
- realtime updates
- custom role/permission management beyond author/assignee checks

## 3. Recommended Approach

Use a simple two-level task experience:

1. board page for scanning tasks by status
2. detail page for reading, editing, deleting, and commenting

This is the smallest approach that still feels like a real team tool. It fits the current App Router + Server Actions + Prisma structure without introducing client-side state complexity.

More interactive options such as inline side panels or drag-and-drop were intentionally rejected because they raise UI and state-management cost without improving the first release enough to justify it.

## 4. Data Model

Add `Task`, `Comment`, and `TaskStatus` to Prisma.

```prisma
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  passwordHash String
  name         String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  tasksAuthored Task[]    @relation("TaskAuthor")
  tasksAssigned Task[]    @relation("TaskAssignee")
  comments      Comment[]
}

model Task {
  id          String     @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  authorId    String
  assigneeId  String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  author      User       @relation("TaskAuthor", fields: [authorId], references: [id])
  assignee    User       @relation("TaskAssignee", fields: [assigneeId], references: [id])
  comments    Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  body      String
  taskId    String
  authorId  String
  createdAt DateTime @default(now())

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [authorId], references: [id])
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}
```

Notes:

- `authorId` is the creator and never comes from the form. It always uses the current logged-in user.
- `assigneeId` is required in the first version.
- comments cascade when a task is deleted.

## 5. Routes and UI

The first version needs 3 screens.

### `/dashboard`

Repurpose the protected dashboard into the team board entry point.

- show a top-level board heading and a `New Task` action
- render 3 columns: `TODO`, `IN_PROGRESS`, `DONE`
- each task card shows:
  - title
  - assignee
  - author
  - created date
- clicking a card moves to task detail

The board is a presentation layer only. Users do not change status by dragging cards in this version.

### `/tasks/new`

Provide a task creation form with:

- `title`
- `description`
- `assigneeId`
- `status`

Defaults:

- `status = TODO`
- `authorId = current user`

### `/tasks/[id]`

Render:

- task metadata: title, status, author, assignee
- task description
- comment list
- comment form

Conditionally render edit and delete controls only when the current user is the author or assignee.

Users who are neither the author nor assignee can still view the task and add comments.

## 6. Feature Structure

Add a new feature module:

```text
src/features/tasks/
  actions.ts
  queries.ts
  validation.ts
  components/
```

Use the existing project conventions:

- server actions for mutations
- Zod for validation
- Prisma for data access
- `FormState` for form responses
- page files in `src/app` as route shells only

No new cross-cutting abstraction is needed for this feature.

## 7. Queries

Keep the query layer small.

- `getBoardTasks()`
  - fetch all tasks needed for the board
  - include author and assignee display fields
  - order by `updatedAt desc` or `createdAt desc`
- `getTaskDetail(taskId)`
  - fetch one task
  - include author, assignee, comments, and comment authors
- `getAssignableUsers()`
  - fetch users for the assignee select field

Implementation preference:

- fetch the board tasks once
- split into the 3 status columns in application code

This is simpler than running 3 separate status queries and is enough for the expected scale of this starter app.

## 8. Server Actions

Add 4 task actions.

- `createTask`
- `updateTask`
- `deleteTask`
- `addComment`

Behavior:

- `createTask`
  - requires login
  - validates form input
  - stores `authorId` from the current session
- `updateTask`
  - requires login
  - requires current user to be author or assignee
  - updates title, description, assignee, and status
- `deleteTask`
  - requires login
  - requires current user to be author or assignee
  - deletes task and cascades comments
- `addComment`
  - requires login
  - any logged-in user can post

Return shape should reuse the existing shared `FormState`. There is no need for a new action response type.

## 9. Authorization Rules

Authorization stays intentionally narrow.

Rules:

- any logged-in user can view the board
- any logged-in user can open task detail
- any logged-in user can add comments
- only author or assignee can edit a task
- only author or assignee can delete a task

Recommended implementation:

1. read current user via `getCurrentUser()`
2. fetch the task when needed
3. check `task.authorId === user.id || task.assigneeId === user.id`

If the permission rule appears in more than one place, extract a very small helper such as `canManageTask(task, userId)`. Do not build a generic permissions framework.

## 10. Validation

Use Zod schemas in `src/features/tasks/validation.ts`.

Task fields:

- `title`: required, trimmed, max 100 chars
- `description`: optional, trimmed, max 2000 chars
- `status`: enum of `TODO | IN_PROGRESS | DONE`
- `assigneeId`: required string

Comment fields:

- `body`: required, trimmed, max 1000 chars

Validation remains at the trust boundary in server actions, following the existing codebase pattern.

## 11. Data Refresh Flow

Use `revalidatePath()` after mutations.

- create task:
  - revalidate `/dashboard`
  - redirect to `/tasks/[id]` or `/dashboard`
- update task:
  - revalidate `/dashboard`
  - revalidate `/tasks/[id]`
- delete task:
  - revalidate `/dashboard`
  - redirect to `/dashboard`
- add comment:
  - revalidate `/tasks/[id]`

No realtime sync or optimistic UI is required for the first version.

## 12. Testing

Keep tests focused and small.

- add schema tests for task validation
- add schema tests for comment validation
- add one small permission test if authorization logic is extracted into a helper

Full database-backed integration tests are not required for this iteration.

## 13. Success Criteria

The feature is successful when:

- logged-in users can open a shared 3-column team board
- a user can create a task with an assignee
- tasks appear in the correct status column
- a user can open task detail and read comments
- any logged-in user can add a comment
- only author or assignee can update or delete the task
- board and detail views refresh correctly after mutations
- the implementation follows the existing feature-module structure

## 14. Implementation Notes

Keep the first version intentionally plain.

- prefer standard form submits over richer client-side interactions
- prefer server-rendered data over extra client state
- prefer one simple permission check over reusable policy layers
- prefer existing UI components over inventing a new design system surface

Future additions such as drag-and-drop, filters, activity history, or notifications can be layered on later if real usage justifies them.
