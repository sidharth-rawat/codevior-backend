# Use an official Node.js runtime as a parent image
FROM node:18

# Set environment variable to ensure Puppeteer downloads Chromium
ENV PUPPETEER_CACHE_DIR=/usr/src/app/.cache

# Install required dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    supervisor \
    libnss3 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libasound2 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libxss1 \
    libgconf-2-4 \
    libgtk-3-0 \
    libxshmfence1 \
    --no-install-recommends && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install dependencies and ensure Chromium is downloaded
RUN npm install && \
    mkdir -p /usr/src/app/.cache && \
    npm rebuild puppeteer

# Copy the rest of the application code
COPY . .

# Create log directory for Supervisor
RUN mkdir -p /var/log/supervisord

# Copy Supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose the port the app runs on
EXPOSE 3002
EXPOSE 6002

EXPOSE 587

# Command to run Supervisor
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
