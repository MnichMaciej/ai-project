import type { APIRoute } from "astro";
import { AccountService } from "../../lib/services/account.service.ts";
import type { DeleteAccountResponse } from "../../types.ts";

export const prerender = false;

/**
 * DELETE handler for deleting the authenticated user's account
 *
 * Process:
 * 1. Verifies user authentication via middleware (locals.user)
 * 2. Signs out the user session
 * 3. Deletes user record from database (triggers cascade deletion of projects)
 * 4. Deletes user from auth.users using Admin API
 * 5. AI queries are soft-deleted via database trigger (preserves audit logs)
 *
 * Returns 200 OK with { success: true } on success
 * Returns 401 Unauthorized if user is not authenticated
 * Returns 500 Internal Server Error if deletion fails
 */
export const DELETE: APIRoute = async ({ locals }) => {
  try {
    // Guard clause: Check if user is authenticated
    if (!locals.user?.id) {
      return new Response(JSON.stringify({ error: "Authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Guard clause: Verify supabase client is available
    if (!locals.supabase) {
      console.error("Supabase client not available in locals");
      return new Response(JSON.stringify({ error: "Failed to delete user" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Initialize account service and delete user account
    const accountService = new AccountService(locals.supabase);
    await accountService.deleteUserAccount(locals.user.id);

    // Return success response
    const response: DeleteAccountResponse = { success: true };
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle service errors with code and message structure
    if (error && typeof error === "object" && "code" in error && "message" in error) {
      const err = error as { code: number; message: string };
      console.error(`Error in DELETE /api/account (${err.code}):`, err.message);
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.code,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle unexpected errors
    console.error("Unexpected error in DELETE /api/account:", error);
    return new Response(JSON.stringify({ error: "Failed to delete user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
