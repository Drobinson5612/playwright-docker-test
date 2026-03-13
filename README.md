# Playwright-Docker-Test

Containerized TypeScript application that uses Playwright to interact with test websites. For UI automation - currently using Yahoo! Finance's daily list of IPOs as a test website, navigate to the website, retrieve data, and perform basic validations. For API automation - currently using [prompt-helper](https://github.com/Drobinson5612/prompt-helper) as a test website. Validates basic API tests against the back-end.

## Overview
This project demonstrates:
- Running Playwright browsers in headless mode inside Docker
- Testing across multiple browsers (Chromium, Firefox, WebKit)
- API testing with comprehensive test coverage (75 tests)
- Extracting data from test website
- Outputting data to log files

## Prerequisites

- Docker 
- Node.js 20+ 
- npm or yarn
- Playwright
- Git (optional)
- Prompt Helper API running on port 5000 (for API tests)

## Docker Usage

### Build Docker Image

```bash
docker build -t playwright-docker-test .
```

### Run Container

```bash
docker run -v $(pwd)/logs:/app/logs playwright-docker-test
```

### Using Docker Compose

**Run the scraper:**
```bash
docker-compose up
```

**Run tests (UI + API):**
```bash
docker-compose run --rm playwright-tests
```

**Run tests (UI):**
```bash
docker-compose run --rm playwright-ui-tests
```

**Run tests (API-only):**
```bash
docker-compose run --rm playwright-api-tests
```

**View test results:**
```bash
npx playwright show-report
```

