import { test, expect } from '@playwright/test';

const TARGET_URL = 'https://finance.yahoo.com/calendar/ipo';

test.describe('Browser Connectivity Tests', () => {
  
  test('Browser can connect and load IPO page', async ({ page, browserName }) => {
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('finance.yahoo.com');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log(`${browserName} connected successfully. Page title: ${title}`);
  });
  
});
