# Similarity Server 설계 문서

## 개요
바다거북 스프 게임의 유사도 계산을 담당하는 독립 서버.
Gemini API 호출 없이 FastText 임베딩 기반 수학 연산으로 유사도를 계산한다.

---

## 기술 스펙

### 런타임
- Python 3.11
- Docker (Railway 배포)

### 라이브러리
| 라이브러리 | 버전 | 역할 |
|---|---|---|
| `fastapi` | 0.115.12 | REST API 서버 프레임워크 |
| `uvicorn[standard]` | 0.34.0 | ASGI 서버 |
| `fasttext` | 최신 (소스 빌드) | FastText 모델 로딩 + 벡터 추출 |
| `numpy` | 2.2.4 | 코사인 유사도 계산 |
| `kiwipiepy` | 0.18.2 | 한국어 형태소 분석 (조사 제거 등) |
| `pydantic` | 2.11.1 | 요청/응답 스키마 검증 |

### FastText 모델
- Facebook 공식 한국어 사전학습 모델: `cc.ko.300.bin`
- 300차원 벡터
- 크기: 약 4.2GB

---

## 전체 플로우

### 게임 질문 흐름
```
사용자 입력
    │
    ├── 질문 ("빨간색이야?")
    │       └── turtlesoup(Next.js)
    │               ├── similarity-server → 유사도 계산 (임베딩)
    │               └── Gemini → 답변 생성 ("아니야~")
    │
    └── 단어 추측 ("수박")
            └── turtlesoup(Next.js)
                    └── similarity-server → 유사도 계산만 (Gemini 호출 없음)
```

### 유사도 계산 흐름
```
요청: { word: "수박", guess: "참외" }
    │
    ├── kiwipiepy로 형태소 분석 (조사 제거)
    │       "수박이" → "수박"
    │
    ├── FastText로 각 단어 벡터 추출
    │       "수박" → [0.12, -0.45, 0.78, ...] (300차원)
    │       "참외" → [0.11, -0.43, 0.75, ...]
    │
    ├── 코사인 유사도 계산 (numpy)
    │       → 0.89
    │
    └── 응답: { score: 89 }  (0~100 정수)
```

---

## API 명세

### `POST /similarity`
유사도 계산

**요청**
```json
{
  "word": "수박",
  "guess": "참외"
}
```

**응답**
```json
{
  "score": 89
}
```

### `GET /health`
서버 상태 확인 (Railway 헬스체크용)

**응답**
```json
{
  "status": "ok"
}
```

---

## 배포

- **플랫폼**: Railway
- **빌드**: Dockerfile (소스에서 fasttext 빌드)
- **모델 파일**: Railway Volume에 마운트 또는 서버 시작 시 다운로드

---

## turtlesoup 연동

`lib/similarity.ts`에서 Gemini 호출 제거 → similarity-server URL로 fetch 교체

```ts
const res = await fetch(`${process.env.SIMILARITY_SERVER_URL}/similarity`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ word, guess }),
});
const { score } = await res.json();
```

환경변수 `SIMILARITY_SERVER_URL`에 Railway 배포 URL 설정.
