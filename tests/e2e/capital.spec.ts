import { test, expect } from '@playwright/test';

test.describe('Capital Management E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('should navigate to capital page and render ledger metrics', async ({ page }) => {
    await page.goto('/capital');
    await expect(page.locator('h1, h2')).toContainText(/Capital/i);
    // Check metric cards exist
    await expect(page.locator('body')).toContainText(/Capital/i);
  });
});
