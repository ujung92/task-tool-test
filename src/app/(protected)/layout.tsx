import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/features/users/queries'
import { logout } from '@/features/auth/actions'
import { Button } from '@/components/ui/Button'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  // 진짜 유저 검증(proxy는 쿠키 존재만 봤음). 없으면 로그인으로.
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div>
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex gap-4 text-sm">
          <Link href="/dashboard" className="font-medium hover:underline">
            대시보드
          </Link>
          <Link href="/settings" className="font-medium hover:underline">
            설정
          </Link>
        </div>
        <form action={logout}>
          <Button className="bg-gray-700 hover:bg-gray-800">로그아웃</Button>
        </form>
      </nav>
      {children}
    </div>
  )
}
