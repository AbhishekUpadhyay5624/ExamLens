# ExamLens backend image.
# Includes OpenCV + ffmpeg system libs needed by the ML pipeline.
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# System dependencies for OpenCV (libGL, glib) and ffmpeg for clip extraction.
RUN apt-get update && apt-get install -y --no-install-recommends \
        ffmpeg \
        libgl1 \
        libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python deps first for better layer caching.
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Pre-download the YOLO weights so the first request doesn't stall on a network
# fetch (best effort — ignored if offline at build time).
RUN python -c "from ultralytics import YOLO; YOLO('yolo11n.pt')" || true

COPY . .

# Storage is a volume in docker-compose; create the mount point.
RUN mkdir -p /app/storage

EXPOSE 8000

# Runs the API. The default (thread) worker runs inside this same process.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
