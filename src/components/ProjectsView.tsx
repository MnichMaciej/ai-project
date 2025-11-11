import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectsList } from "@/components/ProjectsList";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonGrid, SkeletonGridMore } from "@/components/SkeletonCard";
import { InfiniteScrollTrigger } from "@/components/InfiniteScrollTrigger";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertCircle, Search } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";

/**
 * ProjectsView - Main container for the projects view
 * Manages state, data fetching, and conditional rendering based on state
 * Supports pagination, infinite scroll, and search filtering
 */
export function ProjectsView() {
  const limit = 10; // Default page size
  
  // Search state with debounce
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>("");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Offset state - initialized from URL
  const [offset, setOffset] = useState<number>(0);
  
  // Error state for load more
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  
  // Initialize from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlSearch = params.get("search") || "";
    const urlOffset = parseInt(params.get("offset") || "0", 10);
    
    setSearchQuery(urlSearch);
    setDebouncedSearchQuery(urlSearch);
    setOffset(urlOffset);
  }, []);
  
  // Update URL params when search or offset changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (debouncedSearchQuery.trim()) {
      params.set("search", debouncedSearchQuery.trim());
    } else {
      params.delete("search");
    }
    
    if (offset > 0) {
      params.set("offset", offset.toString());
    } else {
      params.delete("offset");
    }
    
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    window.history.replaceState({}, "", newUrl);
  }, [debouncedSearchQuery, offset]);
  
  // Debounce search query (400ms delay)
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      const prevSearch = debouncedSearchQuery;
      setDebouncedSearchQuery(searchQuery);
      // Reset offset when search changes
      if (searchQuery !== prevSearch) {
        setOffset(0);
        setLoadMoreError(null);
      }
    }, 400);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, debouncedSearchQuery]);

  // Use projects hook with pagination parameters
  const { projects, loading, error, total, hasMore, loadingMore, refetch, loadMore: loadMoreProjects } = useProjects({
    limit,
    offset,
    search: debouncedSearchQuery.trim().length > 0 ? debouncedSearchQuery.trim() : undefined,
  });

  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Ref for last item in list (for infinite scroll)
  const lastItemRef = useRef<HTMLDivElement>(null);

  const handleAddProject = useCallback(() => {
    // Navigate to create project page
    window.location.href = "/projects/new";
  }, []);

  const handleEdit = useCallback((id: string) => {
    // Navigate to edit project page
    window.location.href = `/projects/${id}/edit`;
  }, []);
  
  // Handle loading more projects (infinite scroll)
  const handleLoadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loadMoreError) {
      return;
    }
    
    setLoadMoreError(null);
    
    try {
      await loadMoreProjects();
      // Hook manages offset internally, but we update URL offset for bookmarking
      setOffset((prev) => prev + limit);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się załadować kolejnych projektów";
      setLoadMoreError(errorMessage);
      toast.error(errorMessage);
    }
  }, [loadingMore, hasMore, loadMoreError, loadMoreProjects, limit]);
  
  // Handle retry load more
  const handleRetryLoadMore = useCallback(() => {
    setLoadMoreError(null);
    handleLoadMore();
  }, [handleLoadMore]);
  
  // Handle search change
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (deletingId) return; // Prevent multiple delete operations

    setDeletingId(id);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/auth/login";
          return;
        }
        throw new Error("Nie udało się usunąć projektu");
      }

      // Show success toast
      toast.success("Projekt został pomyślnie usunięty");

      // Refetch projects after successful deletion
      await refetch();
      
      // Adjust offset if current page becomes empty
      if (projects.length === 1 && offset > 0) {
        setOffset((prev) => Math.max(0, prev - limit));
      }
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Nie udało się usunąć projektu. Spróbuj ponownie.");
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, refetch, projects.length, offset, limit]);

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <>
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 animate-in fade-in duration-300">
          <div className="mb-4 md:mb-6">
            <div className="h-9 w-48 bg-muted animate-pulse rounded-md mb-2" />
            <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
          </div>
          <SkeletonGrid count={6} />
        </div>
        <MobileBottomNav />
      </>
    );
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <>
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col items-center justify-center text-center py-8 md:py-12">
            <AlertCircle
              className="size-12 text-destructive mb-3 md:mb-4 animate-in zoom-in duration-300"
              aria-hidden="true"
            />
            <h2 className="text-2xl font-semibold mb-2">Wystąpił błąd</h2>
            <p className="text-muted-foreground mb-4 md:mb-6 max-w-md">{error}</p>
            <Button onClick={refetch}>Spróbuj ponownie</Button>
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  // Empty state - show when total is 0 (no projects at all, not just filtered)
  if (total === 0 && !loading && !debouncedSearchQuery.trim()) {
    return (
      <>
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <EmptyState onAddProject={handleAddProject} />
        </div>
        <MobileBottomNav searchValue={searchQuery} onSearchChange={handleSearchChange} />
      </>
    );
  }

  // Projects list
  return (
    <>
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold drop-shadow-sm">Moje projekty</h1>
            <p className="text-foreground/80 mt-1 text-sm md:text-base font-medium drop-shadow-sm">
              {debouncedSearchQuery.trim()
                ? `${projects.length} z ${total} ${total === 1 ? "projektu" : "projektów"}`
                : `${total} ${total === 1 ? "projekt" : total < 5 && total > 1 ? "projekty" : "projektów"}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop search input */}
            <div className="hidden md:flex relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Szukaj po nazwie lub technologii..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 pr-3"
                aria-label="Pole wyszukiwania projektów"
              />
            </div>
            <Button
              onClick={handleAddProject}
              className="hidden md:flex shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Dodaj projekt
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-3 py-2 md:px-4 md:py-3 rounded-md mb-4 md:mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="size-5" />
            <span>{error}</span>
          </div>
        )}

        {debouncedSearchQuery.trim() && projects.length === 0 && !loading && (
          <div className="text-center py-8 md:py-12">
            <p className="text-muted-foreground">
              Nie znaleziono projektów pasujących do zapytania &quot;{debouncedSearchQuery}&quot;
            </p>
          </div>
        )}

        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <ProjectsList 
            projects={projects} 
            onEdit={handleEdit} 
            onDelete={handleDelete}
            lastItemRef={lastItemRef}
          />
        </div>
        
        {/* Loading more indicator */}
        {loadingMore && (
          <div className="mt-4">
            <SkeletonGridMore count={3} />
          </div>
        )}
        
        {/* Load more error with retry */}
        {loadMoreError && !loadingMore && (
          <div className="mt-4 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="size-5" />
              <span>{loadMoreError}</span>
            </div>
            <Button onClick={handleRetryLoadMore} variant="outline" size="sm">
              Spróbuj ponownie
            </Button>
          </div>
        )}
        
        {/* Infinite scroll trigger */}
        {!loading && projects.length > 0 && !loadMoreError && (
          <InfiniteScrollTrigger
            onLoadMore={handleLoadMore}
            hasMore={hasMore}
            loadingMore={loadingMore}
          />
        )}
      </div>
      <MobileBottomNav searchValue={searchQuery} onSearchChange={handleSearchChange} />
    </>
  );
}
