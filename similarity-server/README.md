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

brew install python@3.11

cd similarity-server
rm -rf venv
/opt/homebrew/opt/python@3.11/bin/python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000