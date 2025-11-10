import { SupabaseClient } from "../../db/supabase.client.ts";

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
   * 3. AI queries are soft-deleted via database trigger (preserves audit logs)
   *
   * @param userId - The ID of the user to delete
   * @throws Object with code and message properties if operation fails
   */
  async deleteUserAccount(userId: string): Promise<void> {
    // Guard clause: validate userId is provided
    if (!userId || typeof userId !== "string" || userId.trim() === "") {
      throw { code: 400, message: "User ID is required" };
    }

    // Step 1: Verify user exists before attempting deletion
    const { data: existingUser, error: fetchError } = await this.supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (fetchError || !existingUser) {
      console.error("Error fetching user for deletion:", fetchError);
      throw { code: 404, message: "User not found" };
    }

    // Step 2: Sign out the user session
    const { error: signOutError } = await this.supabase.auth.signOut();

    if (signOutError) {
      console.error("Error signing out user during account deletion:", signOutError);
      throw { code: 500, message: "Failed to sign out user" };
    }

    // Step 3: Delete user record from database
    // This triggers ON DELETE CASCADE on projects table
    // When projects are deleted, the soft_delete_ai_queries trigger marks
    // associated AI queries as deleted (deleted_at = CURRENT_TIMESTAMP)
    const { error: deleteError } = await this.supabase.from("users").delete().eq("id", userId);

    if (deleteError) {
      console.error("Error deleting user account:", deleteError);
      throw { code: 500, message: "Failed to delete user account" };
    }
  }
}
