import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

// Get API configuration from environment variables
const API_BASE_URL = process.env.PROMPT_HELPER_API_URL || 'http://localhost:3000';
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '30000', 10);
const TEST_RETRIES = parseInt(process.env.TEST_RETRIES || '1', 10);

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: TEST_RETRIES,
  workers: 1,
  timeout: TEST_TIMEOUT,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ],
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // Base URL for API tests
    baseURL: API_BASE_URL,
  },
  projects: [
    // UI Tests - Browser-based tests
    {
      name: 'chromium-ui',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*api\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'firefox-ui',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*api\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Firefox'],
      },
    },
    {
      name: 'webkit-ui',
      testMatch: /.*\.spec\.ts/,
      testIgnore: /.*api\/.*\.spec\.ts/,
      use: { 
        ...devices['Desktop Safari'],
      },
    },
    // API Tests - No browser needed
    {
      name: 'api-tests',
      testMatch: /.*api\/.*\.spec\.ts/,
      use: {
        baseURL: API_BASE_URL,
      },
    },
  ],
});
