import React from "react";
import { ProfileHeader } from "./ProfileHeader";
import { AccountSettings } from "./AccountSettings";
import type { AccountViewModel } from "./types";
import type { UserDto } from "../../types";
import { useAuth } from "../../lib/hooks/useAuth";

/**
 * AccountView - Main container component for account management view
 * Manages global state (loading, errors) and uses user data from useAuth hook
 */
export function AccountView() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [viewModel, setViewModel] = React.useState<AccountViewModel>({
    user: null,
    isLoading: true,
    error: null,
    isDeleting: false,
  });

  // Update view model when auth data changes
  React.useEffect(() => {
    if (authLoading) {
      setViewModel((prev) => ({ ...prev, isLoading: true }));
      return;
    }

    if (!authUser) {
      setViewModel({
        user: null,
        isLoading: false,
        error: "Brak autoryzacji",
        isDeleting: false,
      });
      return;
    }

    // Use user data from useAuth hook
    // If createdAt/updatedAt are missing, use defaults
    const userDto: UserDto = {
      id: authUser.id,
      email: authUser.email,
      createdAt: authUser.createdAt || new Date().toISOString(),
      updatedAt: authUser.updatedAt || new Date().toISOString(),
    };

    setViewModel({
      user: userDto,
      isLoading: false,
      error: null,
      isDeleting: false,
    });
  }, [authUser, authLoading]);

  // Show loading state
  if (viewModel.isLoading || authLoading) {
    return (
      <main className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-sm text-muted-foreground">Ładowanie danych profilu...</p>
          </div>
        </div>
      </main>
    );
  }

  // Show error state
  if (viewModel.error || !viewModel.user) {
    return (
      <main className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-destructive mb-4">{viewModel.error || "Nie udało się załadować danych profilu"}</p>
            <a href="/projects" className="text-primary hover:underline">
              Powrót do projektów
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-8">
      <header>
        <ProfileHeader user={viewModel.user} />
      </header>
      <section>
        <AccountSettings />
      </section>
    </main>
  );
}
