# Playwright-Docker-Test

Containerized TypeScript application that uses Playwright to interact with a test website. Using Yahoo! Finance's daily list of IPOs as a test website, this application navigates to the website, retrieves data, and performs basic validations. 

## Overview
This project demonstrates:
- Running Playwright browsers in headless mode inside Docker
- Testing across multiple browsers (Chromium, Firefox, WebKit)
- Extracting data from test website
- Outputting data to log files

## Prerequisites

- Playwright
- Docker 
- Node.js 20+ 
- npm or yarn
- Git (optional)

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

```bash
docker-compose up
```

