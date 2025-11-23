FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install Poetry
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

# Copy and install dependencies
COPY pyproject.toml poetry.lock* ./
RUN pip install --no-cache-dir \
    fastapi \
    "uvicorn[standard]" \
    sqlalchemy \
    asyncpg \
    pydantic \
    pydantic-settings \
    "livekit-agents[bithuman]" \
    "livekit-api" \
    nanoid \
    python-dotenv \
    httpx \
    alembic \
    "livekit-plugins-noise-cancellation" || \
    poetry install --no-dev --no-interaction --no-ansi

# Copy application code
COPY . .

# Ensure agent server entry point is executable
RUN chmod +x /app/start_agent_server_direct.py || true

# Create non-root user
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8080

# Default command runs FastAPI server
# For agent server, override with: python3 -m src.livekit.agent_server
CMD ["python3", "-m", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]

