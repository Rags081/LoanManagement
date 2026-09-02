import { test, expect } from '@playwright/test';

test.describe('Dashboard E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('should render dashboard summary cards and financial metrics', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/Capital/i);
    await expect(page.locator('body')).toContainText(/Interest Earnings/i);
  });
});
