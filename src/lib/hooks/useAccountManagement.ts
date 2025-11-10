import React from "react";
import { toast } from "sonner";
import type { DeleteAccountResponse } from "../../types";

/**
 * Custom hook for managing account operations (delete account)
 * Encapsulates API logic for account management
 */
export function useAccountManagement() {
  const [isDeleting, setIsDeleting] = React.useState(false);

  /**
   * Delete user account
   * Calls DELETE /api/account, signs out user, and redirects to home
   */
  const deleteAccount = React.useCallback(async (): Promise<void> => {
    if (isDeleting) return;

    setIsDeleting(true);

    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Nie udało się usunąć konta";
        throw new Error(errorMessage);
      }

      const data: DeleteAccountResponse = await response.json();

      if (!data.success) {
        throw new Error("Nie udało się usunąć konta");
      }

      // Sign out user using API endpoint
      await fetch("/api/auth/logout", {
        method: "POST",
      });

      // Show success message
      toast.success("Konto zostało pomyślnie usunięte");

      // Redirect to home after short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Nie udało się usunąć konta";
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  }, [isDeleting]);

  return {
    deleteAccount,
    isDeleting,
  };
}
