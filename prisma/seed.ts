import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: { email: 'demo@example.com', name: 'Demo User', passwordHash },
  })

  const teammate = await prisma.user.upsert({
    where: { email: 'teammate@example.com' },
    update: {},
    create: { email: 'teammate@example.com', name: 'Teammate', passwordHash },
  })

  await prisma.task.upsert({
    where: { id: 'seed-task-team-board' },
    update: {},
    create: {
      id: 'seed-task-team-board',
      title: 'Task board sample',
      description: 'Seed task for verifying the board layout.',
      status: 'TODO',
      authorId: demoUser.id,
      assigneeId: teammate.id,
    },
  })

  console.log('Seed ready: demo@example.com / password123, teammate@example.com / password123')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
