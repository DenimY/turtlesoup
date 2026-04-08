import os
import gzip
import shutil
import time
import urllib.request
import numpy as np
from collections import defaultdict
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from kiwipiepy import Kiwi
from gensim.models import KeyedVectors

MODEL_PATH = "/app/model/cc.ko.300.vec"
MODEL_URL = "https://dl.fbaipublicfiles.com/fasttext/vectors-crawl/cc.ko.300.vec.gz"
MODEL_GZ_PATH = MODEL_PATH + ".gz"

API_SECRET = os.environ.get("API_SECRET", "")

# Rate limiting: IP당 분당 최대 요청 수
RATE_LIMIT = 60
rate_store: dict[str, list[float]] = defaultdict(list)

model: KeyedVectors = None
kiwi = Kiwi()


def download_model():
    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    if os.path.exists(MODEL_PATH):
        print("[model] 이미 존재함, 다운로드 스킵")
        return
    print("[model] 다운로드 시작...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_GZ_PATH)
    print("[model] 압축 해제 중...")
    with gzip.open(MODEL_GZ_PATH, "rb") as f_in:
        with open(MODEL_PATH, "wb") as f_out:
            shutil.copyfileobj(f_in, f_out)
    os.remove(MODEL_GZ_PATH)
    print("[model] 다운로드 완료")


def normalize(text: str) -> str:
    try:
        tokens = kiwi.tokenize(text)
        words = [t.form for t in tokens if t.tag.startswith(("N", "V", "XR"))]
        return " ".join(words) if words else text
    except Exception:
        return text


def get_vector(text: str) -> np.ndarray | None:
    words = text.split()
    vecs = [model[w] for w in words if w in model]
    if not vecs:
        return None
    return np.mean(vecs, axis=0)


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    norm_a = np.linalg.norm(a)
    norm_b = np.linalg.norm(b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(a, b) / (norm_a * norm_b))


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    download_model()
    print("[model] 로딩 중...")
    model = KeyedVectors.load_word2vec_format(MODEL_PATH, binary=False, encoding="utf-8", unicode_errors="ignore")
    print("[model] 로딩 완료")
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://turtlesoup.vercel.app"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


def check_auth(request: Request):
    if not API_SECRET:
        return
    token = request.headers.get("x-api-secret", "")
    if token != API_SECRET:
        raise HTTPException(status_code=403, detail="Forbidden")


def check_rate_limit(request: Request):
    ip = request.client.host
    now = time.time()
    window = 60.0
    rate_store[ip] = [t for t in rate_store[ip] if now - t < window]
    if len(rate_store[ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail="Too many requests")
    rate_store[ip].append(now)


class SimilarityRequest(BaseModel):
    word: str
    guess: str

    @field_validator("word", "guess")
    @classmethod
    def validate_length(cls, v: str) -> str:
        if len(v.strip()) == 0:
            raise ValueError("빈 문자열은 허용되지 않아")
        if len(v) > 50:
            raise ValueError("너무 긴 입력이야")
        return v.strip()


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/similarity")
def similarity(req: SimilarityRequest, request: Request):
    check_auth(request)
    check_rate_limit(request)

    if req.word == req.guess:
        return {"score": 100}

    norm_word = normalize(req.word)
    norm_guess = normalize(req.guess)

    vec_word = get_vector(norm_word)
    vec_guess = get_vector(norm_guess)

    if vec_word is None or vec_guess is None:
        return {"score": 0}

    sim = cosine_similarity(vec_word, vec_guess)
    score = int(max(0, min(100, sim * 100)))

    return {"score": score}
