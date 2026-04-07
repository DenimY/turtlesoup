# 🐢 바다거북 스프 — 설계 기획서

## 개요

매일 새로운 단어를 스무고개로 맞추는 데일리 웹 게임.  
거북이 캐릭터가 화면 중앙에 고정된 채, 말풍선으로 AI 답변을 전달한다.

---

## 기술 스택

| 역할 | 기술 |
|---|---|
| 프레임워크 | Next.js 16 (App Router) |
| 호스팅 | Vercel (Cron Jobs 포함) |
| DB | Supabase (PostgreSQL) |
| AI | Anthropic Claude API |
| 스타일 | Tailwind CSS 4 |

---

## 게임 흐름

```
매일 자정 (KST)
  └─ /api/cron → Claude가 단어 생성 → Supabase words 테이블 저장

유저 접속
  └─ /api/today-word → 카테고리만 응답 (word는 서버에서만 보관)

유저 질문 입력
  └─ /api/ask
       ├─ 유사도 체크 (Claude) → 85% 이상이면 정답 처리
       └─ 일반 질문이면 거북이 말투로 예/아니오 답변

정답 시
  └─ /api/solve → 순위 계산 → Supabase solves 저장
       └─ WinScreen 표시 (질문수 / 경과시간 / 오늘 N번째)
            └─ 결과 클립보드 공유
```

---

## UI 구조

```
┌─────────────────────────────┐
│                             │
│       [ 말풍선 텍스트 ]       │  ← 거북이 답변만 바뀜 (채팅형 X)
│           🐢                │  ← 화면 중앙 고정
│       [유사도 바 ====  ]     │  ← 거북이 바로 아래
│    질문 3개  00:42           │
│                             │
│  Q. 먹을 수 있어?            │  ← 질문 로그 (하단, 작게)
│     그래.                   │
│  Q. 차가워?                  │
│     아니.                   │
│                             │
│  [ 질문하거나 정답을 맞춰봐... ] [전송] │
└─────────────────────────────┘
```

**디자인 원칙**
- 화이트톤, 심플
- 말풍선 내용만 교체 (채팅 UI 아님)
- 질문 로그는 하단에 작게만 표시
- 유사도 바는 거북이 아래 위치

---

## 폴더 구조

```
turtlesoup/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                # 메인 게임 UI
│   └── api/
│       ├── ask/route.ts        # 질문 → Claude API
│       ├── today-word/route.ts # 오늘 단어 조회 (word 제외)
│       ├── solve/route.ts      # 정답 처리 + 순위 저장
│       └── cron/route.ts       # 매일 자정 단어 생성
├── components/
│   ├── TurtleChat.tsx          # 거북이 + 말풍선 (고정)
│   ├── ChatBubble.tsx          # 질문 로그 아이템
│   ├── StatsBar.tsx            # 유사도 바 + 질문수/시간
│   ├── InputBar.tsx            # 입력창
│   ├── WinScreen.tsx           # 정답 화면 + 공유
│   └── ShareModal.tsx          # 클립보드 공유 모달
├── lib/
│   ├── prompts.ts              # 거북이 말투 (여기만 수정)
│   ├── supabase.ts             # DB 클라이언트
│   └── similarity.ts           # 유사도 계산 (Claude)
├── public/
│   └── turtle.png              # 거북이 이미지 (교체 가능)
├── proxy.ts                    # Cron 엔드포인트 보호
└── vercel.json                 # Cron 스케줄 (KST 자정)
```

---

## DB 스키마

### `words` 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | int8 | PK |
| date | date | 날짜 (unique) |
| word | text | 오늘의 단어 (서버 전용) |
| category | text | 카테고리 (유저에게 노출 가능) |
| hints | text[] | 힌트 배열 (현재 미사용, 광고 연동 예정) |

### `solves` 테이블

| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | int8 | PK |
| date | date | 날짜 |
| session_id | text | 브라우저 UUID |
| q_count | int4 | 질문 횟수 |
| elapsed_sec | int4 | 경과 시간 (초) |
| rank | int4 | 오늘 몇 번째 정답자 |

---

## API 명세

### `GET /api/today-word`
오늘 단어 메타 조회 (word 필드 제외)

**Response**
```json
{ "id": 1, "date": "2026-04-07", "category": "음식", "hints": [] }
```

---

### `POST /api/ask`
질문 제출. 유사도 85% 이상이면 정답으로 처리.

**Request**
```json
{ "question": "먹을 수 있어?" }
```

**Response**
```json
{ "answer": "그래.", "correct": false, "score": 12 }
{ "answer": "...맞아.", "correct": true, "score": 97 }
```

---

### `POST /api/solve`
정답 확정 및 순위 저장

**Request**
```json
{ "session_id": "uuid", "q_count": 7, "elapsed_sec": 142 }
```

**Response**
```json
{ "rank": 3 }
```

---

### `GET /api/cron`
Vercel Cron이 KST 자정에 호출. `Authorization: Bearer {CRON_SECRET}` 필요.

---

## 거북이 말투

`lib/prompts.ts` 한 파일에서만 관리.

| 상황 | 예시 |
|---|---|
| 기본 긍정 | "그래." |
| 기본 부정 | "아니." |
| 애매함 | "...글쎄." / "비슷해." |
| 정답 | "...맞아." |
| 대기 | "뭐든 물어봐." |
| 생각 중 | "음..." |

**규칙**: 반말, 10자 이내, 단어 언급 금지

---

## 유사도 판단

Claude Haiku에게 0~100 점수를 요청.  
85점 이상이면 정답 처리. 동의어·유사어도 인정.

---

## 환경변수

```env
ANTHROPIC_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

---

## 미구현 (예정)

- **힌트 시스템**: 광고 시청 후 해금. 현재 hints[] 컬럼만 준비, 코드는 주석 처리 상태.
- **거북이 이미지**: `public/turtle.png` 플레이스홀더. 교체 가능.
