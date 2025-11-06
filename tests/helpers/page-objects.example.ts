/**
 * Example Page Object Model for E2E tests
 * 
 * This is a template showing how to structure Page Objects.
 * Create similar files for each page/section you want to test.
 */

import { Page, Locator } from '@playwright/test';

export class ExamplePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h1');
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async goto() {
    await this.page.goto('/');
  }

  async clickSubmit() {
    await this.submitButton.click();
  }
}

