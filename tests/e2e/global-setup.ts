import { chromium, FullConfig } from "@playwright/test";
import { saveAuthenticatedState } from "./helpers/auth";

/**
 * Global setup function that runs once before all tests.
 * This function authenticates the smoke test user via API and saves the session state
 * so it can be reused across all E2E tests.
 */
async function globalSetup(config: FullConfig) {
  // Get baseURL from config - it can be in project-specific use object
  const baseURL = config.projects[0]?.use?.baseURL || process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000";

  // Create a browser context for authentication
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL,
  });

  try {
    // Authenticate and save storage state
    const storageStatePath = "tests/e2e/.auth/user.json";
    await saveAuthenticatedState(context, baseURL, storageStatePath);
    console.log(`✅ Authentication successful. Storage state saved to ${storageStatePath}`);
  } catch (error) {
    console.error("❌ Authentication failed:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
