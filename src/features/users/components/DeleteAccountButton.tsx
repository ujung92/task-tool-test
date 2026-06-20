'use client'
import { deleteAccount } from '../actions'
import { Button } from '@/components/ui/Button'

export function DeleteAccountButton() {
  return (
    <form
      action={deleteAccount}
      onSubmit={(e) => {
        if (!confirm('정말 탈퇴하시겠어요? 되돌릴 수 없습니다.')) e.preventDefault()
      }}
    >
      <Button type="submit" className="bg-red-600 hover:bg-red-700">
        회원 탈퇴
      </Button>
    </form>
  )
}
