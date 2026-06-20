import { getCurrentUser } from '@/features/users/queries'

export default async function DashboardPage() {
  const user = await getCurrentUser() // 레이아웃이 null이 아님을 보장하지만, 타입 안전하게 옵셔널 처리
  return (
    <main className="mx-auto max-w-md space-y-4 p-8">
      <h1 className="text-xl font-bold">대시보드</h1>
      <p>
        안녕하세요, <strong>{user?.name ?? user?.email}</strong> 님!
      </p>
      <ul className="text-sm text-gray-600">
        <li>이메일: {user?.email}</li>
        <li>가입일: {user?.createdAt.toLocaleDateString('ko-KR')}</li>
      </ul>
    </main>
  )
}
