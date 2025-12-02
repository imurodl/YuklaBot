FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# system deps (ffmpeg for processing, build tools for some wheels)
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        build-essential \
        libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies first for better caching
COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy application
COPY . /app

# Create non-root user (commented out to avoid permission issues with mounted files)
# RUN useradd -m botuser && chown -R botuser:botuser /app
# USER botuser

EXPOSE 8000
CMD ["python3", "bot.py"]
