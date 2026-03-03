from datetime import datetime, timedelta, timezone
from pathlib import Path
import hashlib
import json
import secrets
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data.json"
TOKEN_EXPIRE_HOURS = 24


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _load_data() -> Dict:
    if not DATA_FILE.exists():
        default = {
            "users": {},
            "tokens": {},
            "scores": []
        }
        DATA_FILE.write_text(json.dumps(default, ensure_ascii=False, indent=2), encoding="utf-8")
        return default
    return json.loads(DATA_FILE.read_text(encoding="utf-8"))


def _save_data(data: Dict) -> None:
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=20)
    password: str = Field(min_length=6, max_length=64)


class LoginRequest(BaseModel):
    username: str
    password: str


class ScoreRequest(BaseModel):
    token: str
    score: int = Field(ge=0, le=999999)


app = FastAPI(title="Community Game Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"ok": True, "time": _now().isoformat()}


@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    data = _load_data()
    username = payload.username.strip()
    if username in data["users"]:
        raise HTTPException(status_code=409, detail="用户名已存在")

    data["users"][username] = {
        "password_hash": _hash_password(payload.password),
        "created_at": _now().isoformat(),
    }
    _save_data(data)
    return {"message": "注册成功"}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    data = _load_data()
    user = data["users"].get(payload.username)
    if not user or user["password_hash"] != _hash_password(payload.password):
        raise HTTPException(status_code=401, detail="用户名或密码错误")

    token = secrets.token_urlsafe(24)
    expires_at = (_now() + timedelta(hours=TOKEN_EXPIRE_HOURS)).isoformat()
    data["tokens"][token] = {"username": payload.username, "expires_at": expires_at}
    _save_data(data)
    return {"token": token, "username": payload.username, "expires_at": expires_at}


def _resolve_user_by_token(token: str) -> Optional[str]:
    data = _load_data()
    token_info = data["tokens"].get(token)
    if not token_info:
        return None

    expires_at = datetime.fromisoformat(token_info["expires_at"])
    if expires_at < _now():
        data["tokens"].pop(token, None)
        _save_data(data)
        return None
    return token_info["username"]


@app.get("/api/auth/me")
def me(token: str):
    username = _resolve_user_by_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="登录态无效")
    return {"username": username}


@app.post("/api/game/submit")
def submit_score(payload: ScoreRequest):
    username = _resolve_user_by_token(payload.token)
    if not username:
        raise HTTPException(status_code=401, detail="登录态无效，请重新登录")

    data = _load_data()
    data["scores"].append(
        {
            "username": username,
            "score": payload.score,
            "created_at": _now().isoformat(),
        }
    )
    data["scores"] = sorted(data["scores"], key=lambda x: x["score"], reverse=True)[:20]
    _save_data(data)
    return {"message": "成绩已提交"}


@app.get("/api/game/leaderboard")
def leaderboard():
    data = _load_data()
    return {"items": data["scores"][:10]}
