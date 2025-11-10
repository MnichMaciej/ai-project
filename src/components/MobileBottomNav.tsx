import { useState, useCallback } from "react";
import { Search, Plus, User, LogOut, ArrowLeft, Home } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";

interface MobileBottomNavProps {
  onSearchFocus?: () => void;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  variant?: "default" | "form"; // "form" for add/edit project pages
  onBack?: () => void;
}

/**
 * MobileBottomNav - Bottom navigation bar for mobile devices
 * Provides quick access to search, add project, and user actions
 * Only visible on screens smaller than 768px (md breakpoint)
 *
 * Variants:
 * - "default": Shows search, add project, and user menu (for projects list)
 * - "form": Shows back, home, and user menu (for add/edit project pages)
 */
export function MobileBottomNav({
  onSearchFocus,
  searchValue,
  onSearchChange,
  variant = "default",
  onBack,
}: MobileBottomNavProps) {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleAddProject = useCallback(() => {
    window.location.href = "/projects/new";
  }, []);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  }, [onBack]);

  const handleHome = useCallback(() => {
    window.location.href = "/projects";
  }, []);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (response.ok || response.redirected) {
        toast.success("Wylogowano pomyślnie");
        window.location.href = "/auth/login";
      } else {
        throw new Error("Nie udało się wylogować");
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Nie udało się wylogować. Spróbuj ponownie.");
    } finally {
      setIsLoggingOut(false);
      setIsUserMenuOpen(false);
    }
  }, [isLoggingOut]);

  const handleSearchClick = useCallback(() => {
    setIsSearchOpen(true);
    // Focus search input after sheet opens
    setTimeout(() => {
      const searchInput = document.getElementById("mobile-search-input");
      if (searchInput) {
        searchInput.focus();
      }
      if (onSearchFocus) {
        onSearchFocus();
      }
    }, 100);
  }, [onSearchFocus]);

  const handleSearchChangeInternal = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      if (onSearchChange) {
        onSearchChange(value);
      }
    },
    [onSearchChange]
  );

  // Don't render if auth is loading or user is not authenticated
  if (authLoading || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background/80 backdrop-blur-xl border-t border-border shadow-2xl"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around h-16 px-1">
          {variant === "default" ? (
            <>
              {/* Search Button */}
              <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <SheetTrigger asChild>
                  <button
                    onClick={handleSearchClick}
                    className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg hover:bg-accent transition-colors bg-card/50 backdrop-blur-sm border border-border/50"
                    aria-label="Wyszukaj projekty"
                  >
                    <Search className="size-5 text-foreground drop-shadow" aria-hidden="true" />
                    <span className="text-xs text-foreground/90 font-medium drop-shadow-sm">Szukaj</span>
                  </button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[40vh]">
                  <SheetHeader>
                    <SheetTitle>Wyszukaj projekty</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <Input
                      id="mobile-search-input"
                      type="text"
                      placeholder="Wpisz nazwę projektu..."
                      value={searchValue || ""}
                      onChange={handleSearchChangeInternal}
                      className="w-full"
                      aria-label="Pole wyszukiwania projektów"
                    />
                  </div>
                </SheetContent>
              </Sheet>

              {/* Add Project Button - Primary Action */}
              <button
                onClick={handleAddProject}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
                aria-label="Dodaj nowy projekt"
              >
                <Plus className="size-6" aria-hidden="true" />
                <span className="text-xs font-medium">Dodaj</span>
              </button>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg hover:bg-accent transition-colors bg-card/50 backdrop-blur-sm border border-border/50"
                aria-label="Powrót"
              >
                <ArrowLeft className="size-5 text-foreground drop-shadow" aria-hidden="true" />
                <span className="text-xs text-foreground/90 font-medium drop-shadow-sm">Wstecz</span>
              </button>

              {/* Home Button - Primary Action */}
              <button
                onClick={handleHome}
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-3 py-1 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 transition-all shadow-lg"
                aria-label="Strona główna"
              >
                <Home className="size-6" aria-hidden="true" />
                <span className="text-xs font-medium">Home</span>
              </button>
            </>
          )}

          {/* User Menu */}
          <Sheet open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
            <SheetTrigger asChild>
              <button
                className="flex flex-col items-center justify-center gap-0.5 min-w-[44px] min-h-[44px] px-2 py-1 rounded-lg hover:bg-accent transition-colors bg-card/50 backdrop-blur-sm border border-border/50"
                aria-label="Menu użytkownika"
              >
                <User className="size-5 text-foreground drop-shadow" aria-hidden="true" />
                <span className="text-xs text-foreground/90 font-medium drop-shadow-sm">Profil</span>
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-auto">
              <SheetHeader>
                <SheetTitle>Menu użytkownika</SheetTitle>
              </SheetHeader>
              <div className="space-y-3 w-full">
                {user?.email && (
                  <div className="px-3 py-2 md:px-4 text-sm text-muted-foreground">
                    <p className="font-medium">{user.email}</p>
                  </div>
                )}
                <div className="px-3 py-2 md:px-4 flex items-center justify-between border-b border-border">
                  <span className="text-sm font-medium">Motyw</span>
                  <ThemeToggle />
                </div>
                <div className="px-3 md:px-4">
                  <Button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      window.location.href = "/profile";
                    }}
                    variant="outline"
                    className="w-full mb-2"
                    aria-label="Profil"
                  >
                    <User className="size-4 mr-2" aria-hidden="true" />
                    Profil
                  </Button>
                </div>
                <div className="px-3 md:px-4 mb-2">
                  <Button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    variant="destructive"
                    className="w-full"
                    aria-label="Wyloguj się"
                  >
                    {isLoggingOut ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Wylogowywanie...
                      </>
                    ) : (
                      <>
                        <LogOut className="size-4 mr-2" aria-hidden="true" />
                        Wyloguj
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content overlap on mobile */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
