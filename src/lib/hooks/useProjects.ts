import { useState, useEffect, useCallback } from "react";
import type { ProjectDto } from "@/types";

// Frontend-specific types for the hook (not in types.ts per user instructions)
interface ProjectsViewState {
  loading: boolean;
  projects: ProjectDto[];
  error: string | null;
  total: number;
  hasMore: boolean;
}

interface UseProjectsOptions {
  limit?: number;
  offset?: number;
  search?: string;
  sort?: "status:asc" | "status:desc";
}

interface UseProjectsReturn extends ProjectsViewState {
  refetch: () => Promise<void>;
  loadMore: () => Promise<void>;
  loadingMore: boolean;
}

interface ProjectsListResponse {
  projects: ProjectDto[];
  total: number;
  hasMore?: boolean;
}

/**
 * Custom hook for managing projects data fetching and state
 * Handles loading, error states, pagination, and provides refetch/loadMore functionality
 * Supports appending new pages to existing list for infinite scroll
 */
export function useProjects(options: UseProjectsOptions = {}): UseProjectsReturn {
  const { limit = 10, offset: initialOffset = 0, search, sort } = options;
  
  const [state, setState] = useState<ProjectsViewState>({
    loading: true,
    projects: [],
    error: null,
    total: 0,
    hasMore: false,
  });
  
  const [currentOffset, setCurrentOffset] = useState<number>(initialOffset);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);

  const fetchProjects = useCallback(async (offset: number, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setState((prev) => ({ ...prev, loading: true, error: null }));
    }

    try {
      // Build URL with query parameters
      const url = new URL("/api/projects", window.location.origin);
      url.searchParams.set("limit", limit.toString());
      url.searchParams.set("offset", offset.toString());
      if (search && search.trim().length > 0) {
        url.searchParams.set("search", search.trim());
      }
      if (sort) {
        url.searchParams.set("sort", sort);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        // Handle different error codes
        if (response.status === 401) {
          // Redirect to login for unauthorized users
          window.location.href = "/auth/login";
          return;
        }

        const errorMessage = response.status === 500 ? "Błąd serwera, spróbuj ponownie" : "Nie udało się pobrać projektów";
        
        // Throw error for loadMore, set state for initial load
        if (append) {
          throw new Error(errorMessage);
        }
        
        setState((prev) => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));
        return;
      }

      const data: ProjectsListResponse = await response.json();

      setState((prev) => ({
        loading: false,
        projects: append ? [...prev.projects, ...(data.projects || [])] : data.projects || [],
        error: null,
        total: data.total || 0,
        hasMore: data.hasMore ?? false,
      }));
      
      setCurrentOffset(offset);
    } catch (error) {
      console.error("Error fetching projects:", error);

      // For loadMore, re-throw the error
      if (append) {
        throw error;
      }

      // Handle network errors or other exceptions for initial load
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Nie udało się pobrać projektów",
      }));
    } finally {
      setLoadingMore(false);
    }
  }, [limit, search, sort]);

  // Fetch projects on component mount or when options change
  useEffect(() => {
    setCurrentOffset(initialOffset);
    fetchProjects(initialOffset, false);
  }, [initialOffset, search, sort, limit, fetchProjects]);

  const refetch = useCallback(async () => {
    await fetchProjects(initialOffset, false);
  }, [fetchProjects, initialOffset]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !state.hasMore) {
      return;
    }
    const nextOffset = currentOffset + limit;
    await fetchProjects(nextOffset, true);
  }, [loadingMore, state.hasMore, currentOffset, limit, fetchProjects]);

  return {
    ...state,
    refetch,
    loadMore,
    loadingMore,
  };
}
