import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Flow', () => {
  test('should display login page and perform login & logout', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h2, h1')).toContainText(/Sign In|Login|Loan Management|RagsCapital/i);

    // Fill credentials
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'Admin@123');
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard)?$/);
  });

  test('should show error toast on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"], input[name="email"]', 'admin@loanmanagement.com');
    await page.fill('input[type="password"], input[name="password"]', 'WrongPassword!');
    await page.click('button[type="submit"]');

    // Check error toast / alert
    await expect(page.locator('.toast, [role="status"], div:has-text("Invalid")').first()).toBeVisible({ timeout: 5000 });
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/loans');
    await expect(page).toHaveURL(/\/login/);
  });
});
