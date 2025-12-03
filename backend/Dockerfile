FROM python:3.14-slim
ARG REQUESTS_CA_BUNDLE
LABEL maintainer="synthetiqsignals.com" \
    org.label-schema.docker.dockerfile="/Dockerfile" \
    org.label-schema.name="EHR Signals Agent for Heathcare RCM" 

#python variable settings for image set
ENV PYTHONPATH="/app/signals/" \
    PYTHONDONTWITEBYTECODE=1 \
    PYTHONBUFFERED=1 \
    REQUESTS_CA_BUNDLE=${REQUESTS_CA_BUNDLE}

COPY ${REQUESTS_CA_BUNDLE} /etc/docker/certs.d/

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Expose port
EXPOSE 8000

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
