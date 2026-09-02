import { test, expect } from '@playwright/test';

test.describe('Loans E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('should navigate to loans list and render ledger table', async ({ page }) => {
    await page.goto('/loans');
    await expect(page.locator('h1, h2')).toContainText(/Loan/i);
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th:has-text("Principal Received")')).toBeVisible();
    await expect(page.locator('th:has-text("Interest Received")')).toBeVisible();
  });
});
