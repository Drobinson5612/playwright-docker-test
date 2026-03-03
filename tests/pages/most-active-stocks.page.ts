import { Page, Locator } from '@playwright/test';

/**
 * Page Object Model for Yahoo Finance Most Active Stocks page
 * Centralizes all UI element selectors and page interactions
 */
export class MostActiveStocksPage {
  readonly page: Page;
  readonly url = 'https://finance.yahoo.com/markets/stocks/most-active/';
  readonly stockTable: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly tableCells: Locator;
  
  constructor(page: Page) {
    this.page = page;
    
    // Initialize locators
    this.stockTable = page.locator('table');
    this.tableHeaders = page.locator('table thead th');
    this.tableRows = page.locator('table tbody tr');
    this.tableCells = page.locator('table tbody tr td');
  }
  
  /**
   * Navigate to the Most Active Stocks page
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
  }
  
  /**
   * Wait for the page to fully load
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForTimeout(3000);
    await this.stockTable.waitFor({ state: 'visible', timeout: 10000 });
  }
  
  /**
   * Extract all table data from the most active stocks
   * @returns Array of row data, where each row is an array of cell values
   */
  async getTableData(): Promise<string[][]> {
    return await this.tableRows.evaluateAll(rows => {
      return rows.map(row => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).map(cell => cell.textContent?.trim() || '');
      });
    });
  }
  
  /**
   * Get the number of stock entries in the table
   * @returns Count of table rows
   */
  async getRowCount(): Promise<number> {
    return await this.tableRows.count();
  }
  
  /**
   * Get data from a specific row by index
   * @param index - Zero-based row index
   * @returns Array of cell values for the specified row
   */
  async getRowByIndex(index: number): Promise<string[]> {
    const row = this.tableRows.nth(index);
    return await row.locator('td').evaluateAll(cells => {
      return cells.map(cell => cell.textContent?.trim() || '');
    });
  }
  
  /**
   * Get the page title
   * @returns Page title text
   */
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
  
  /**
   * Check if the page loaded successfully
   * @returns True if the page URL contains the expected domain
   */
  async isPageLoaded(): Promise<boolean> {
    return this.page.url().includes('finance.yahoo.com');
  }
}
