import { getCurrentUser } from '@/features/users/queries'
import { ProfileForm } from '@/features/users/components/ProfileForm'
import { ChangePasswordForm } from '@/features/users/components/ChangePasswordForm'
import { DeleteAccountButton } from '@/features/users/components/DeleteAccountButton'

export default async function SettingsPage() {
  const user = await getCurrentUser()
  return (
    <main className="mx-auto max-w-md space-y-8 p-8">
      <h1 className="text-xl font-bold">설정</h1>

      <section className="space-y-3">
        <h2 className="font-semibold">프로필</h2>
        <ProfileForm defaultName={user?.name ?? ''} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">비밀번호 변경</h2>
        <ChangePasswordForm />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-red-700">위험 구역</h2>
        <DeleteAccountButton />
      </section>
    </main>
  )
}
