import React from "react";
import { toast } from "sonner";
import type { GenerateProjectAIRequest, GenerateProjectAIResponse } from "@/types";
import type { UseFormReturn } from "react-hook-form";
import type { CreateProjectFormData } from "./useProjectForm";
import type { UpdateProjectFormData } from "./useProjectEditForm";

// ViewModel types for AI generation state
export type AIStatus = "idle" | "loading" | "success" | "error";

export interface AIState {
  isOpen: boolean;
  fileLinks: string;
  parsedLinks: string[] | null;
  isLoading: boolean;
  queryCount: number;
  error: string | null;
  status: AIStatus;
}

export interface FileLinksValidation {
  valid: boolean;
  links: string[];
  errors: string[];
}

interface UseAIGenerationOptions {
  projectId: string | null;
  initialQueryCount?: number;
  form: UseFormReturn<CreateProjectFormData | UpdateProjectFormData>;
  onUpdateProject?: (updates: { description: string; technologies: string[] }) => void;
}

interface UseAIGenerationReturn {
  state: AIState;
  openInput: () => void;
  closeInput: () => void;
  validateLinks: (input: string) => FileLinksValidation;
  generateAI: (links: string[]) => Promise<void>;
  isButtonDisabled: boolean;
  updateQueryCount: (count: number) => void;
  setFileLinks: (value: string) => void;
}

const MAX_FILES = 8;
const MAX_QUERIES = 5;
const GITHUB_RAW_URL_REGEX = /^https:\/\/raw\.githubusercontent\.com\/.+\/.+\/.+\/.+$/;

/**
 * Validates file links input
 * Checks for: number of links (max 8), GitHub raw URL format
 */
function validateFileLinks(input: string): FileLinksValidation {
  const errors: string[] = [];
  const lines = input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return {
      valid: false,
      links: [],
      errors: ["Musisz podać co najmniej jeden link"],
    };
  }

  if (lines.length > MAX_FILES) {
    errors.push(`Maksymalnie ${MAX_FILES} plików`);
  }

  const invalidUrls: string[] = [];
  lines.forEach((line, index) => {
    if (!GITHUB_RAW_URL_REGEX.test(line)) {
      invalidUrls.push(`Link ${index + 1}: nieprawidłowy format GitHub raw URL`);
    }
  });

  if (invalidUrls.length > 0) {
    errors.push(...invalidUrls);
  }

  return {
    valid: errors.length === 0,
    links: lines,
    errors,
  };
}

/**
 * Custom hook for managing AI generation state and API integration
 * Handles form validation, API calls, and state updates
 */
export function useAIGeneration({
  projectId,
  initialQueryCount = 0,
  form,
  onUpdateProject,
}: UseAIGenerationOptions): UseAIGenerationReturn {
  const [state, setState] = React.useState<AIState>({
    isOpen: false,
    fileLinks: "",
    parsedLinks: null,
    isLoading: false,
    queryCount: initialQueryCount,
    error: null,
    status: "idle",
  });

  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Update query count when it changes externally
  const updateQueryCount = React.useCallback((count: number) => {
    setState((prev) => ({ ...prev, queryCount: count }));
  }, []);

  const openInput = React.useCallback(() => {
    if (state.queryCount >= MAX_QUERIES) {
      toast.error(`Osiągnięto limit ${MAX_QUERIES} zapytań na projekt`);
      return;
    }

    if (!projectId) {
      toast.error("AI jest dostępne tylko po zapisaniu projektu");
      return;
    }

    setState((prev) => ({ ...prev, isOpen: true, error: null, fileLinks: "" }));
  }, [state.queryCount, projectId]);

  const closeInput = React.useCallback(() => {
    // Abort ongoing request if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isOpen: false,
      fileLinks: "",
      parsedLinks: null,
      error: null,
      status: "idle",
    }));
  }, []);

  const validateLinks = React.useCallback((input: string): FileLinksValidation => {
    return validateFileLinks(input);
  }, []);

  const generateAI = React.useCallback(
    async (links: string[]): Promise<void> => {
      if (!projectId) {
        setState((prev) => ({
          ...prev,
          error: "Brak ID projektu",
          status: "error",
        }));
        return;
      }

      // Validate links before sending
      const linksText = links.join("\n");
      const validation = validateFileLinks(linksText);
      if (!validation.valid) {
        setState((prev) => ({
          ...prev,
          error: validation.errors.join(". "),
          status: "error",
          fileLinks: linksText,
        }));
        return;
      }

      // Check query count before sending
      setState((prev) => {
        if (prev.queryCount >= MAX_QUERIES) {
          return {
            ...prev,
            error: `Osiągnięto limit ${MAX_QUERIES} zapytań`,
            status: "error",
          };
        }

        return {
          ...prev,
          isLoading: true,
          error: null,
          status: "loading",
          parsedLinks: validation.links,
        };
      });

      // Create abort controller for request cancellation
      abortControllerRef.current = new AbortController();

      try {
        const request: GenerateProjectAIRequest = {
          fileLinks: validation.links,
        };

        const response = await fetch(`/api/projects/${projectId}/ai-generate`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(request),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          let errorMessage = "Nie udało się wygenerować danych z AI";

          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch {
            // If parsing fails, use default error message
          }

          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }

          if (response.status === 403) {
            errorMessage = "Brak dostępu do tego projektu";
          }

          if (response.status === 404) {
            errorMessage = "Projekt nie został znaleziony";
          }

          if (response.status === 429) {
            errorMessage = `Osiągnięto limit ${MAX_QUERIES} zapytań na projekt`;
          }

          if (response.status === 500) {
            errorMessage = "Błąd serwera AI. Spróbuj ponownie później.";
          }

          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: errorMessage,
            status: "error",
          }));

          toast.error(errorMessage);
          return;
        }

        const data: GenerateProjectAIResponse = await response.json();

        // Update form fields with AI-generated data
        form.setValue("description", data.description, { shouldValidate: true });
        form.setValue("technologies", data.technologies, { shouldValidate: true });

        // Call optional callback to update project state
        if (onUpdateProject) {
          onUpdateProject({
            description: data.description,
            technologies: data.technologies,
          });
        }

        // Update state with success
        setState((prev) => ({
          ...prev,
          isLoading: false,
          queryCount: data.queryCount,
          status: "success",
          error: null,
        }));

        toast.success("Dane wygenerowane pomyślnie! Edytuj przed zapisaniem.");
      } catch (error) {
        // Handle abort error separately
        if (error instanceof Error && error.name === "AbortError") {
          setState((prev) => ({
            ...prev,
            isLoading: false,
            status: "idle",
            error: null,
          }));
          return;
        }

        // Handle network errors
        const errorMessage =
          error instanceof Error && error.message.includes("fetch")
            ? "Błąd połączenia z serwerem. Sprawdź połączenie internetowe."
            : "Nie udało się wygenerować danych z AI. Spróbuj ponownie.";

        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
          status: "error",
        }));

        toast.error(errorMessage);
        console.error("Error generating AI:", error);
      } finally {
        abortControllerRef.current = null;
      }
    },
    [projectId, form, onUpdateProject]
  );

  const setFileLinks = React.useCallback((value: string) => {
    setState((prev) => ({ ...prev, fileLinks: value }));
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const isButtonDisabled = state.queryCount >= MAX_QUERIES || !projectId || state.isLoading;

  return {
    state,
    openInput,
    closeInput,
    validateLinks,
    generateAI,
    isButtonDisabled,
    updateQueryCount,
    setFileLinks,
  };
}
