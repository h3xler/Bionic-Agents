FROM python:3.12-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml ./
COPY src/ ./src/

# Install dependencies
RUN uv pip install --system -e .

# Install httpx for API calls
RUN uv pip install --system httpx

# Run the agent
CMD ["python", "src/agent.py", "start"]
