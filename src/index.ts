import { chromium, firefox, webkit, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

const TARGET_URL = 'https://finance.yahoo.com/calendar/ipo';
const LOG_DIR = './logs';
const LOG_FILE = path.join(LOG_DIR, 'ipo-data.log');

type BrowserType = 'chromium' | 'firefox' | 'webkit';

async function runTest(browserType: BrowserType): Promise<void> {
  console.log(`Starting test with ${browserType}...`);
  
  let browser: Browser | null = null;
  
  try {
    // Launch browser in headless mode
    switch (browserType) {
      case 'chromium':
        browser = await chromium.launch({ headless: true });
        break;
      case 'firefox':
        browser = await firefox.launch({ headless: true });
        break;
      case 'webkit':
        browser = await webkit.launch({ headless: true });
        break;
    }

    const context = await browser.newContext();
    const page = await context.newPage();

    // Navigate to target URL
    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });

    // Wait for dynamic content to load
    await page.waitForTimeout(3000);

    // Wait for page to complete loading
    console.log('Page loaded successfully');

    // Extract table data
    const tableData = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table tbody tr'));
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        return cells.map(cell => cell.textContent?.trim() || '').join(' | ');
      }).join('\n');
    });

    // Log the data
    logData(browserType, tableData);

    console.log(`Test completed successfully with ${browserType}`);

    // Close browser
    await browser.close();
  } catch (error) {
    console.error(`Error during test with ${browserType}:`, error);
    if (browser) {
      await browser.close();
    }
    throw error;
  }
}

function logData(browserType: string, data: string): void {
  // Ensure log directory exists
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString();
  const logEntry = `\n=== ${browserType.toUpperCase()} - ${timestamp} ===\n${data}\n`;

  fs.appendFileSync(LOG_FILE, logEntry, 'utf-8');
  console.log(`Data logged to ${LOG_FILE}`);
}

async function main(): Promise<void> {
  console.log('Playwright Docker Test - Starting...');

  const browsers: BrowserType[] = ['chromium', 'firefox', 'webkit'];

  for (const browserType of browsers) {
    await runTest(browserType);
  }

  console.log('All tests completed successfully');
  process.exit(0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
