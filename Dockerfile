# ---------- 前端构建 (React)
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---------- 运行环境 (Flask 同时提供接口和前端页面)
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    TZ=Asia/Shanghai \
    PORT=8000 \
    SALES_DB=/app/data/sales.db

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && useradd --uid 1000 --no-create-home app \
    && mkdir -p /app/data && chown app:app /app/data

COPY app.py serve.py schema.sql ./
COPY geo ./geo
COPY --from=web /web/dist ./frontend/dist

USER app
VOLUME /app/data
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen(f'http://127.0.0.1:{os.environ[\"PORT\"]}/api/session', timeout=3)"

# 作为 PID 1 时 Python 不处理 SIGTERM, 用 SIGINT 让 waitress 正常退出
STOPSIGNAL SIGINT
CMD ["python", "serve.py"]
