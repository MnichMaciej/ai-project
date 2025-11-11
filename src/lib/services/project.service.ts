import type {
  CreateProjectDto,
  UpdateProjectDto,
  ProjectDto,
  GenerateProjectAIRequest,
  GenerateProjectAIResponse,
} from "../../types.ts";
import {
  parseApiError,
  createNetworkError,
  createGenericError,
  isNetworkError,
  type ApiError,
} from "../utils/error.utils.ts";

/**
 * Project API service
 * Centralized service for all project-related API calls
 * Provides type-safe methods with consistent error handling
 */
export class ProjectService {
  private readonly baseUrl: string;
  private abortControllers = new Map<string, AbortController>();

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl;
  }

  /**
   * Makes a typed API request with error handling
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    defaultError: string,
    requestId?: string
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Cancel previous request with same ID if exists
    if (requestId) {
      this.abortControllers.get(requestId)?.abort();
    }

    const controller = new AbortController();
    if (requestId) {
      this.abortControllers.set(requestId, controller);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
        credentials: "include",
      });

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          // If parsing fails, create generic error
          throw createGenericError(defaultError);
        }

        const apiError = parseApiError(response, errorData, defaultError);
        throw apiError;
      }

      // Parse successful response
      return await response.json();
    } catch (error) {
      // Handle abort errors
      if (error instanceof Error && error.name === "AbortError") {
        throw createGenericError("Request cancelled");
      }

      // Re-throw ApiError instances
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        throw createNetworkError();
      }

      // Handle unexpected errors
      throw createGenericError(defaultError);
    } finally {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
    }
  }

  /**
   * Cancels a request by ID
   */
  cancelRequest(requestId: string): void {
    this.abortControllers.get(requestId)?.abort();
    this.abortControllers.delete(requestId);
  }

  /**
   * Creates a new project
   */
  async createProject(data: CreateProjectDto): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      "/api/projects",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      "Nie udało się utworzyć projektu"
    );
  }

  /**
   * Gets a project by ID
   */
  async getProject(id: string, requestId?: string): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      `/api/projects/${id}`,
      {
        method: "GET",
      },
      "Nie udało się pobrać projektu",
      requestId
    );
  }

  /**
   * Updates an existing project
   */
  async updateProject(id: string, data: UpdateProjectDto): Promise<ProjectDto> {
    return this.request<ProjectDto>(
      `/api/projects/${id}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      },
      "Nie udało się zaktualizować projektu"
    );
  }

  /**
   * Gets the query count for a project's AI generation feature
   */
  async getProjectQueryCount(id: string): Promise<number> {
    try {
      const data = await this.request<{ queryCount: number }>(
        `/api/projects/${id}/ai-queries/count`,
        {
          method: "GET",
        },
        "Nie udało się pobrać liczby zapytań"
      );
      return data.queryCount || 0;
    } catch (error) {
      // Don't fail the whole operation if query count fails
      console.warn("Failed to fetch query count, defaulting to 0:", error);
      return 0;
    }
  }

  /**
   * Generates project data using AI
   * Special handling for AI endpoint that returns GenerateProjectAIResponse with success: false for errors
   */
  async generateAI(
    id: string,
    request: GenerateProjectAIRequest,
    requestId?: string
  ): Promise<GenerateProjectAIResponse> {
    const url = `${this.baseUrl}/api/projects/${id}/ai-generate`;

    // Cancel previous request with same ID if exists
    if (requestId) {
      this.abortControllers.get(requestId)?.abort();
    }

    const controller = new AbortController();
    if (requestId) {
      this.abortControllers.set(requestId, controller);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
        signal: controller.signal,
        credentials: "include",
      });

      // Parse response (even if status is not OK, we need to check success field)
      const data = (await response.json()) as GenerateProjectAIResponse;

      // If response has success: false, return it (hook will handle the error)
      if (!data.success) {
        return data;
      }

      // If response is not OK and doesn't have success field, throw error
      if (!response.ok) {
        const apiError = parseApiError(response, data, "Nie udało się wygenerować danych z AI");
        throw apiError;
      }

      return data;
    } catch (error) {
      // Handle abort errors
      if (error instanceof Error && error.name === "AbortError") {
        throw createGenericError("Request cancelled");
      }

      // Re-throw ApiError instances
      if (error && typeof error === "object" && "type" in error) {
        throw error;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        throw createNetworkError();
      }

      // Handle unexpected errors
      throw createGenericError("Nie udało się wygenerować danych z AI");
    } finally {
      if (requestId) {
        this.abortControllers.delete(requestId);
      }
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();
