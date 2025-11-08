import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";

// Extend base test with custom fixtures
export const test = base.extend<{
  // Add custom fixtures here if needed
}>({});

export { expect };
export type { Page };
