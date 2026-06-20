import { NextResponse, type NextRequest } from 'next/server'

// 엣지 런타임이라 무겁게 검증하지 않고 '쿠키 존재' 여부만 빠르게 확인한다(낙관적).
// 진짜 유저 검증은 (protected) 레이아웃의 getCurrentUser가 담당한다(이중 안전).
export function middleware(req: NextRequest) {
  const hasSession = req.cookies.has('session')
  if (!hasSession) {
    const url = new URL('/login', req.url)
    url.searchParams.set('next', req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/settings/:path*'],
}
