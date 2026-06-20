# Next.js 보일러플레이트

초보자용 풀스택 스타터. 이메일/비밀번호 인증 + Prisma(SQLite) + 기능별 폴더 구조가 들어있어요.

## 빠른 시작

```bash
npm install
cp .env.example .env # Windows: copy .env.example .env
npm run db:push # DB(SQLite) 만들기
npm run db:seed # 데모 계정 넣기
npm run dev # http://localhost:3000
```

데모 계정: **demo@example.com / password123**

> 운영 배포 전 `.env`의 `SESSION_SECRET`을 긴 랜덤값으로 바꾸세요.
> 예: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

## 폴더 구조

- `src/app` — 라우팅(화면만 얇게). `(auth)`=비로그인, `(protected)`=로그인 필요
- `src/features/<도메인>` — 기능별 로직(서버 액션·검증·세션·조회·컴포넌트)
- `src/components/ui` — 공용 UI(Button/Input/…)
- `src/lib` — 공용 인프라(prisma·env·utils·forms)
- `prisma` — DB 스키마(User 하나)와 시드

## 로그인은 어떻게 동작하나

1. 회원가입: 검증(zod) → 비번 해싱(bcryptjs) → User 생성 → 세션 쿠키 발급
2. 로그인: User 조회 → 비번 비교 → 서명된 JWT(jose)를 httpOnly 쿠키로 저장
3. 보호 페이지: `middleware`가 쿠키 확인 후, `(protected)/layout`이 실제 유저 검증
4. 로그아웃: 쿠키 삭제

관련 파일: `src/features/auth/`(actions·session·password·validation), `src/middleware.ts`

## 새 기능/모델 추가하는 법 (예: 게시글)

1. `prisma/schema.prisma`에 `Post` 모델 추가 → `npm run db:push`
2. `src/features/posts/` 폴더 생성: `actions.ts`·`queries.ts`·`validation.ts`·`components/`
3. `src/app`에 화면 추가(로직은 features에서 import)

## 자주 쓰는 명령어

| 명령                  | 설명                |
| --------------------- | ------------------- |
| `npm run dev`         | 개발 서버           |
| `npm run build`       | 프로덕션 빌드       |
| `npm run test`        | 테스트              |
| `npm run db:studio`   | DB GUI              |
| `npm run db:reset`    | DB 초기화 후 재시드 |

## 배포 시 주의

- `SESSION_SECRET`을 반드시 교체
- DB를 Postgres로 바꾸려면 `schema.prisma`의 `provider`를 `postgresql`로, `DATABASE_URL`을 Postgres 주소로 변경 후 `npm run db:push`
