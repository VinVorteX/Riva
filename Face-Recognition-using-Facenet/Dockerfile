FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-dev \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    libgstreamer1.0-0 \
    libgstreamer-plugins-base1.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements_lite.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements_lite.txt flask flask-cors

# Copy source code
COPY . .

# Create necessary directories
RUN mkdir -p enroll_images face_db

# Expose port
EXPOSE 8000

# Expose port
EXPOSE 8000

# Start Flask API
CMD ["python", "app.py"]