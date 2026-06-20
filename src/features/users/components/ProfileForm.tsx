'use client'
import { useActionState } from 'react'
import { updateProfile } from '../actions'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { FieldError } from '@/components/ui/FieldError'

export function ProfileForm({ defaultName }: { defaultName: string }) {
  const [state, formAction, pending] = useActionState(updateProfile, undefined)
  return (
    <form action={formAction} className="space-y-3">
      {state?.success && <p className="text-sm text-green-600">{state.success}</p>}
      <div>
        <Label htmlFor="name">이름</Label>
        <Input id="name" name="name" type="text" defaultValue={defaultName} />
        <FieldError messages={state?.fieldErrors?.name} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? '저장 중...' : '저장'}
      </Button>
    </form>
  )
}
