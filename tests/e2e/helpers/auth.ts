import { BrowserContext } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * Authenticates a user via API and saves the session storage state for reuse in tests.
 * This function logs in using the smoke test user credentials from environment variables
 * via API call only (no web page navigation) and saves the browser context's storage state
 * (cookies, localStorage, etc.) so it can be reused across multiple tests.
 *
 * @param context - The Playwright browser context to authenticate
 * @param baseURL - The base URL for the API requests
 * @returns Promise that resolves when authentication is complete
 */
export async function authenticateUser(context: BrowserContext, baseURL: string): Promise<void> {
  // Get credentials from environment variables
  const email = process.env.SMOKE_USER_LOGIN;
  const password = process.env.SMOKE_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("SMOKE_USER_LOGIN and SMOKE_USER_PASSWORD environment variables must be set");
  }

  // Create a new page to make API request
  const page = await context.newPage();

  try {
    // Perform login via API only (no page navigation)
    const loginResponse = await page.request.post(`${baseURL}/api/auth/login`, {
      data: {
        email,
        password,
      },
      headers: {
        "Content-Type": "application/json",
      },
    });

    const loginData = await loginResponse.json();

    if (!loginResponse.ok()) {
      const errorData = loginData as { error?: string; failedAttempts?: number };
      throw new Error(`Login failed: ${errorData.error || loginResponse.statusText()}`);
    }

    // Verify login was successful by checking the response
    if (!loginData.user) {
      throw new Error("Login response missing user data");
    }

    // The cookies from the API response are automatically stored in the context
    // No need to navigate to any page - the session is established via API
  } finally {
    await page.close();
  }
}

/**
 * Creates an authenticated browser context with saved storage state.
 * This function authenticates the user via API and saves the storage state to a file,
 * which can then be reused in tests via Playwright's storageState option.
 *
 * @param context - The Playwright browser context to authenticate
 * @param baseURL - The base URL for the API requests
 * @param storageStatePath - Path where to save the storage state file
 * @returns Promise that resolves when authentication and storage state saving is complete
 */
export async function saveAuthenticatedState(
  context: BrowserContext,
  baseURL: string,
  storageStatePath: string
): Promise<void> {
  await authenticateUser(context, baseURL);
  await context.storageState({ path: storageStatePath });
}
