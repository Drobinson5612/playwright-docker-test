import { test, expect } from '@playwright/test';

const TARGET_URL = 'https://finance.yahoo.com/calendar/ipo';

test.describe('Browser Connectivity Tests', () => {
  

  //FIREFOX
  test('Firefox browser can connect and load page', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox', 'This test is only for Firefox');
    
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('finance.yahoo.com');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log(`Firefox connected successfully. Page title: ${title}`);
  });

  //CHROME/CHROMIUM
  test('Chrome browser can connect and load page', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'This test is only for Chrome/Chromium');
    
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('finance.yahoo.com');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log(`Chrome connected successfully. Page title: ${title}`);
  });

  //WEBKIT (SAFARI)
  test('WebKit browser can connect and load page', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'This test is only for WebKit');
    
    await page.goto(TARGET_URL, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    await page.waitForTimeout(3000);
    
    expect(page.url()).toContain('finance.yahoo.com');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    console.log(`WebKit connected successfully. Page title: ${title}`);
  });
});
