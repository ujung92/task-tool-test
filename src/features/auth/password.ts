import bcrypt from 'bcryptjs'

// 비밀번호는 평문 저장 금지. 저장 전 해싱하고, 로그인 시 비교만 한다.
export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
