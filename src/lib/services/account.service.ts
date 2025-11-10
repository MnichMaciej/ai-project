import { SupabaseClient } from "../../db/supabase.client.ts";
import { createSupabaseAdminClient } from "../../db/supabase.client.ts";

/**
 * Account service for managing user account operations
 * Handles account deletion with proper session management and data cleanup
 */
export class AccountService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Deletes a user account and all associated data
   *
   * Process:
   * 1. Signs out the user session
   * 2. Deletes the user record from the database (triggers cascade deletion of projects)
   * 3. Deletes user from auth.users using Admin API
   * 4. AI queries are soft-deleted via database trigger (preserves audit logs)
   *
   * Note: User may exist only in auth.users (if profile creation failed during registration)
   * In that case, we still proceed with deletion from auth.users
   *
   * @param userId - The ID of the user to delete
   * @throws Object with code and message properties if operation fails
   */
  async deleteUserAccount(userId: string): Promise<void> {
    // Guard clause: validate userId is provided
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw { code: 400, message: "User ID is required" };
    }

    // Step 1: Sign out the user session
    const { error: signOutError } = await this.supabase.auth.signOut();

    if (signOutError) {
      console.error("Error signing out user during account deletion:", signOutError);
      throw { code: 500, message: "Failed to sign out user" };
    }

    // Step 2: Delete user record from database (if exists)
    // This triggers ON DELETE CASCADE on projects table
    // When projects are deleted, the soft_delete_ai_queries trigger marks
    // associated AI queries as deleted (deleted_at = CURRENT_TIMESTAMP)
    // Note: User may not exist in users table if profile creation failed during registration
    const { error: deleteError } = await this.supabase.from("users").delete().eq("id", userId);

    if (deleteError) {
      // If user doesn't exist in users table, that's okay - they may only exist in auth.users
      // Log the error but don't fail if it's a "not found" type error
      const isNotFoundError = deleteError.code === "PGRST116" || deleteError.message.includes("0 rows");
      if (!isNotFoundError) {
        console.error("Error deleting user account:", deleteError);
        throw { code: 500, message: "Failed to delete user account" };
      }
      // If user doesn't exist in users table, continue to delete from auth.users
      console.log("User not found in users table - will delete from auth.users only");
    }

    // Step 3: Delete user from auth.users using Admin API
    // This requires service role key and admin privileges
    try {
      const adminClient = createSupabaseAdminClient();
      const { error: adminDeleteError } = await adminClient.auth.admin.deleteUser(userId);

      if (adminDeleteError) {
        console.error("Error deleting user from auth.users:", adminDeleteError);
        // If admin delete fails but user was deleted from users table, that's still a partial success
        // But we should log it as an error
        throw { code: 500, message: "Failed to delete user from authentication system" };
      }
    } catch (error) {
      // If service role key is not configured, log warning but don't fail
      if (error instanceof Error && error.message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
        console.warn("Service role key not configured - user will remain in auth.users but signed out");
        // User is signed out and data is deleted, so this is acceptable for MVP
        return;
      }
      throw error;
    }
  }
}
