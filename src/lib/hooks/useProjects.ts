import { useState, useEffect } from "react";
import type { ProjectDto } from "@/types";

// Frontend-specific types for the hook (not in types.ts per user instructions)
interface ProjectsViewState {
  loading: boolean;
  projects: ProjectDto[];
  error: string | null;
  total: number;
}

interface UseProjectsReturn extends ProjectsViewState {
  refetch: () => Promise<void>;
}

interface ProjectsListResponse {
  projects: ProjectDto[];
  total: number;
}

/**
 * Custom hook for managing projects data fetching and state
 * Handles loading, error states, and provides refetch functionality
 */
export function useProjects(): UseProjectsReturn {
  const [state, setState] = useState<ProjectsViewState>({
    loading: true,
    projects: [],
    error: null,
    total: 0,
  });

  const fetchProjects = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Build URL with query parameters
      // Using default values from projectsQuerySchema: limit=50, offset=0
      const url = new URL("/api/projects", window.location.origin);
      url.searchParams.set("limit", "50");
      url.searchParams.set("offset", "0");
      url.searchParams.set("sort", "status:asc");

      // sort is optional, so we don't set it if not needed

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        // Handle different error codes
        if (response.status === 401) {
          // Redirect to login for unauthorized users
          window.location.href = "/login";
          return;
        }

        throw new Error(response.status === 500 ? "Błąd serwera, spróbuj ponownie" : "Nie udało się pobrać projektów");
      }

      const data: ProjectsListResponse = await response.json();

      setState({
        loading: false,
        projects: data.projects || [],
        error: null,
        total: data.total || 0,
      });
    } catch (error) {
      console.error("Error fetching projects:", error);

      // Handle network errors or other exceptions
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Nie udało się pobrać projektów",
      }));
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    ...state,
    refetch: fetchProjects,
  };
}
