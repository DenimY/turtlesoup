# 🐢 바다거북 스프

매일 새로운 단어를 스무고개로 맞추는 데일리 웹 게임.  
거북이 캐릭터가 화면 중앙에 고정된 채, 말풍선으로 AI 답변을 전달합니다.

---

## 기술 스택 및 버전

| 항목 | 버전 |
|---|---|
| Next.js | 16.2.2 (App Router) |
| React | 19.2.4 |
| TypeScript | 5.x |
| Tailwind CSS | 4.x |
| @anthropic-ai/sdk | 최신 |
| @supabase/supabase-js | 최신 |
| Node.js | 20.x (권장) |

**호스팅 / 인프라**

| 항목 | 설명 |
|---|---|
| Vercel | 배포 + Cron Jobs (KST 자정 단어 자동 생성) |
| Supabase | PostgreSQL DB (words, solves 테이블) |
| Anthropic Claude API | 질문 답변 (Haiku) + 유사도 판단 + 단어 생성 |

---

## 로컬 개발 시작

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일에 아래 값을 채웁니다:

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

### 3. Supabase 테이블 생성

```sql
-- 오늘의 단어
create table words (
  id bigint generated always as identity primary key,
  date date unique not null,
  word text not null,
  category text not null,
  hints text[] default '{}'
);

-- 정답 기록
create table solves (
  id bigint generated always as identity primary key,
  date date not null,
  session_id text not null,
  q_count int not null,
  elapsed_sec int not null,
  rank int not null
);
```

### 4. 오늘 단어 등록

직접 Supabase에서 insert하거나 아래 명령으로 cron API를 수동 호출합니다:

```bash
curl -H "Authorization: Bearer {CRON_SECRET}" http://localhost:3000/api/cron
```

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열면 됩니다.

---

## 주요 스크립트

| 명령어 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 실행 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 빌드 후 실행 |
| `npm run lint` | ESLint 실행 |

---

## 거북이 이미지 교체

`public/turtle.png`를 원하는 이미지로 교체하면 됩니다.  
권장 크기: 144×144px 이상, 투명 배경 PNG.

---

## 설계 문서

자세한 기획 및 구조는 [DESIGN.md](./DESIGN.md)를 참고하세요.
