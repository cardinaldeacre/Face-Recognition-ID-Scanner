FROM python:3.9-slim

# Install system dependencies (Versi terbaru)
RUN apt-get update && apt-get install -y \
    build-essential \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Setup user Hugging Face (UID 1000)
RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

# Copy requirements dan install
COPY --chown=user requirements.txt .
RUN pip install --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

# Copy sisa file proyek
COPY --chown=user . .

# Port wajib Hugging Face
EXPOSE 7860

# Gunakan Gunicorn untuk menjalankan Flask
CMD ["gunicorn", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]