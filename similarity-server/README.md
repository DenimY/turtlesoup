---
title: Turtlesoup Similarity Server
emoji: 🐢
colorFrom: green
colorTo: blue
sdk: docker
pinned: false
---

# Turtlesoup Similarity Server

FastText 기반 한국어 단어 유사도 계산 서버.

## API

### POST /similarity
```json
{ "word": "수박", "guess": "참외" }
→ { "score": 72 }
```

### GET /health
```json
{ "status": "ok", "model_loaded": true }
```
