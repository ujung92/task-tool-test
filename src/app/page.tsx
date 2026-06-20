import Link from 'next/link'
import { getCurrentUser } from '@/features/users/queries'
import { Button } from '@/components/ui/Button'

export default async function HomePage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-md space-y-6 p-8 text-center">
      <h1 className="text-2xl font-bold">Next.js 보일러플레이트</h1>
      <p className="text-gray-600">이메일/비밀번호 인증이 들어있는 풀스택 스타터</p>
      {user ? (
        <Link href="/dashboard">
          <Button>대시보드로 가기</Button>
        </Link>
      ) : (
        <div className="flex justify-center gap-3">
          <Link href="/login">
            <Button>로그인</Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gray-700 hover:bg-gray-800">회원가입</Button>
          </Link>
        </div>
      )}
    </main>
  )
}
