FROM node:20-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    python3 \
    python3-pip \
    && pip3 install --break-system-packages yt-dlp \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Node dependencies
COPY package*.json ./
RUN npm ci --production=false

# Copy source and build
COPY . .
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

EXPOSE 3000

CMD ["npm", "start"]
