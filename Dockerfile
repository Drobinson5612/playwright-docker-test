FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci

# Copy source and config
COPY tsconfig.json ./
COPY playwright.config.ts ./
COPY src ./src
COPY tests ./tests

# Build TypeScript
RUN npm run build

# Ensure playwright binary is accessible
RUN npx playwright --version

# Note: Keep all dependencies for testing
# If running in production mode only, use: RUN npm prune --production

# Create logs directory
RUN mkdir -p /app/logs

# Set volume for logs
VOLUME ["/app/logs"]

# Default command runs the scraper, but can be overridden to run tests
CMD ["node", "dist/index.js"]
