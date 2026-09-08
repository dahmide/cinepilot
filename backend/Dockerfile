FROM python:3.12-slim
WORKDIR /app

COPY requirements.txt .
RUN python -m venv venv && venv/bin/pip install --no-cache-dir -r requirements.txt

COPY requirements-mcp-clickhouse.txt .
RUN python -m venv venv-mcp-clickhouse && venv-mcp-clickhouse/bin/pip install --no-cache-dir -r requirements-mcp-clickhouse.txt

COPY . .
EXPOSE 8080
CMD ["venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]