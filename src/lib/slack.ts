import { prisma } from './prisma'

type TaskEvent = 'created' | 'updated'

const STATUS_LABEL: Record<string, string> = {
  TODO: 'TODO',
  IN_PROGRESS: '진행중',
  DONE: '완료',
}

export async function notifyTaskEvent(event: TaskEvent, taskTitle: string, actorName: string) {
  const token = process.env.SLACK_BOT_TOKEN
  const channel = process.env.SLACK_CHANNEL_ID
  if (!token || !channel) return

  const [total, todo, inProgress, done] = await Promise.all([
    prisma.task.count(),
    prisma.task.count({ where: { status: 'TODO' } }),
    prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
    prisma.task.count({ where: { status: 'DONE' } }),
  ])

  const eventLabel = event === 'created' ? '새 태스크 추가' : '태스크 업데이트'
  const text = [
    `*[${eventLabel}]* ${taskTitle}  _(by ${actorName})_`,
    '',
    `*📊 Dashboard 업무 현황*`,
    `> ${STATUS_LABEL['TODO']} ${todo}건  |  ${STATUS_LABEL['IN_PROGRESS']} ${inProgress}건  |  ${STATUS_LABEL['DONE']} ${done}건  |  전체 ${total}건`,
  ].join('\n')

  try {
    await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    })
  } catch {
    // 알림 실패는 무시 — 메인 플로우에 영향 주지 않음
  }
}
