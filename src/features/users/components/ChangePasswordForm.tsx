'use client'
import { useActionState } from 'react'
import { changePassword } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, undefined)
  return (
    <form action={formAction} className="space-y-3">
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
      <div>
        <Label htmlFor="currentPassword">현재 비밀번호</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
        <FieldError messages={state?.fieldErrors?.currentPassword} />
      </div>
      <div>
        <Label htmlFor="newPassword">새 비밀번호 (8자 이상)</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
        />
        <FieldError messages={state?.fieldErrors?.newPassword} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? '변경 중...' : '비밀번호 변경'}
      </Button>
    </form>
  )
}
