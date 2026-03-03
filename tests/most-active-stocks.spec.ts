import { test, expect } from '@playwright/test';
import { MostActiveStocksPage } from './pages/most-active-stocks.page';

test.describe('Most Active Stocks Tests', () => {
  
  test('Yahoo Finance - Most Active Stocks', async ({ page, browserName }) => {
    // Initialize Page Object
    const mostActiveStocksPage = new MostActiveStocksPage(page);
    
    // Navigate to the page
    await mostActiveStocksPage.navigate();
    
    // Wait for page to load
    await mostActiveStocksPage.waitForPageLoad();
    
    // Verify page loaded successfully
    expect(await mostActiveStocksPage.isPageLoaded()).toBe(true);
    expect(page.url()).toContain('finance.yahoo.com');
    
    // Verify page title
    const title = await mostActiveStocksPage.getPageTitle();
    expect(title).toBeTruthy();
    console.log(`${browserName} - Page title: ${title}`);
    
    // Extract table data
    const tableData = await mostActiveStocksPage.getTableData();
    expect(tableData).toBeTruthy();
    expect(tableData.length).toBeGreaterThan(0);
    
    // Get row count
    const rowCount = await mostActiveStocksPage.getRowCount();
    expect(rowCount).toBeGreaterThan(0);
    console.log(`${browserName} - Found ${rowCount} most active stocks`);
    
    // Log first few rows for verification
    const firstThreeRows = tableData.slice(0, 3);
    console.log(`${browserName} - Sample data:`, JSON.stringify(firstThreeRows, null, 2));
  });
  
});
