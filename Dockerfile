FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create logs directory
RUN mkdir -p /app/logs

# Set volume for logs
VOLUME ["/app/logs"]

# Run the application
CMD ["node", "dist/index.js"]
