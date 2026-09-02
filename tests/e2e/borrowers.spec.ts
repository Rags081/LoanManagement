import { test, expect } from '@playwright/test';

test.describe('Borrowers E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard)?$/);
  });

  test('should navigate to borrowers page and view directory', async ({ page }) => {
    await page.goto('/borrowers');
    await expect(page.locator('h1, h2')).toContainText(/Borrower/i);
    // Table should render borrowers
    await expect(page.locator('table')).toBeVisible();
  });
});
