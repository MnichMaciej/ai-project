import { test, expect } from "@/tests/helpers/playwright-helpers";

/**
 * Example E2E test file
 *
 * This demonstrates how to write E2E tests using Playwright.
 * Replace this with your actual E2E tests.
 */

test("homepage should load", async ({ page }) => {
  await page.goto("/");

  // Wait for page to load
  await page.waitForLoadState("networkidle");

  // Example assertion - adjust based on your actual homepage
  // await expect(page.locator('h1')).toBeVisible();
});

test("should have correct page title", async ({ page }) => {
  await page.goto("/");

  // Example assertion - adjust based on your actual page title
  // await expect(page).toHaveTitle(/Your App Name/);
});
