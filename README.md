# 星火社区 Demo

## 模块说明
- `login/`：登录与注册模块（前端页面）
- `game/`：单页面小游戏模块（点击挑战 + 排行榜）
- `backend/`：FastAPI 后端（认证 + 成绩提交 + 排行榜）

## 启动后端（FastAPI）
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 启动前端静态页
在仓库根目录执行：
```bash
python -m http.server 4173
```
然后访问：
- http://127.0.0.1:4173/login/index.html
- http://127.0.0.1:4173/game/index.html
