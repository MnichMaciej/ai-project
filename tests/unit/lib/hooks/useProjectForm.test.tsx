import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useProjectForm, transformFormData, mapServerErrorsToForm } from "@/lib/hooks/useProjectForm";
import { ProjectStatus } from "@/types";
import { toast } from "sonner";
import { ErrorType } from "@/lib/utils/error.utils";
import type { ApiError } from "@/lib/utils/error.utils";
import { projectService } from "@/lib/services/project.service";

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  href: "",
};
Object.defineProperty(window, "location", {
  value: mockLocation,
  writable: true,
});

// Mock projectService
vi.mock("@/lib/services/project.service", () => ({
  projectService: {
    createProject: vi.fn(),
  },
}));

describe("useProjectForm", () => {
  beforeEach(() => {
    // Suppress console.error output during tests (expected errors are being tested)
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.clearAllMocks();
    mockLocation.href = "";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useProjectForm_should_validate_form_data_on_change", () => {
    it("should validate form data on change", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      // Act
      result.current.form.setValue("name", "Test Project");
      result.current.form.trigger("name");

      // Assert
      await waitFor(() => {
        expect(result.current.form.formState.errors.name).toBeUndefined();
      });
    });

    it("should show validation errors for invalid data", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      // Act
      result.current.form.setValue("name", "");
      result.current.form.trigger("name");

      // Assert
      await waitFor(() => {
        expect(result.current.form.formState.errors.name).toBeDefined();
      });
    });

    it("should handle server validation errors", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());
      const errorDetails = ["name: Nazwa jest wymagana", "description: Opis jest wymagany"];

      // Act
      mapServerErrorsToForm(errorDetails, result.current.form);

      // Assert - form.setError updates state synchronously, trigger form state update
      result.current.form.trigger(); // Trigger validation to update form state

      await waitFor(
        () => {
          expect(result.current.form.formState.errors.name).toBeDefined();
          expect(result.current.form.formState.errors.description).toBeDefined();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("useProjectForm_should_submit_project_creation_request", () => {
    it("should submit project creation successfully", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());
      const mockProject = {
        id: "project-123",
        name: "Test Project",
        description: "Description",
        technologies: ["React"],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      };

      vi.mocked(projectService.createProject).mockResolvedValue(mockProject);

      await act(async () => {
        result.current.form.setValue("name", "Test Project");
        result.current.form.setValue("description", "Description");
        result.current.form.setValue("technologies", ["React"]);
        result.current.form.setValue("status", ProjectStatus.PLANNING);
      });

      // Act
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Assert
      await waitFor(() => {
        expect(vi.mocked(projectService.createProject)).toHaveBeenCalledWith({
          name: "Test Project",
          description: "Description",
          technologies: ["React"],
          status: ProjectStatus.PLANNING,
          repoUrl: null,
          demoUrl: null,
          previewUrl: null,
        });
        expect(toast.success).toHaveBeenCalledWith("Projekt został pomyślnie dodany");
        expect(mockLocation.href).toBe("/projects");
      });
    });

    it("should handle API error response", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      const apiError: ApiError = {
        type: ErrorType.VALIDATION,
        message: "Validation failed",
        statusCode: 400,
        details: ["name: Nazwa jest wymagana"],
      };

      vi.mocked(projectService.createProject).mockRejectedValue(apiError);

      await act(async () => {
        result.current.form.setValue("name", "Test");
        result.current.form.setValue("description", "Description");
        result.current.form.setValue("technologies", ["React"]);
        result.current.form.setValue("status", ProjectStatus.PLANNING);
      });

      // Act
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Validation failed");
      });
    });

    it("should redirect to login on 401 error", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      const apiError: ApiError = {
        type: ErrorType.AUTHENTICATION,
        message: "Unauthorized",
        statusCode: 401,
      };

      vi.mocked(projectService.createProject).mockRejectedValue(apiError);

      await act(async () => {
        result.current.form.setValue("name", "Test");
        result.current.form.setValue("description", "Description");
        result.current.form.setValue("technologies", ["React"]);
        result.current.form.setValue("status", ProjectStatus.PLANNING);
      });

      // Act
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/login");
      });
    });
  });

  describe("useProjectForm_should_handle_network_errors", () => {
    it("should handle network fetch errors", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      const apiError: ApiError = {
        type: ErrorType.NETWORK,
        message: "Błąd połączenia z serwerem. Sprawdź połączenie internetowe.",
      };

      vi.mocked(projectService.createProject).mockRejectedValue(apiError);

      await act(async () => {
        result.current.form.setValue("name", "Test");
        result.current.form.setValue("description", "Description");
        result.current.form.setValue("technologies", ["React"]);
        result.current.form.setValue("status", ProjectStatus.PLANNING);
      });

      // Act
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it("should handle JSON parsing errors", async () => {
      // Arrange
      const { result } = renderHook(() => useProjectForm());

      const apiError: ApiError = {
        type: ErrorType.SERVER,
        message: "Nie udało się utworzyć projektu",
        statusCode: 500,
      };

      vi.mocked(projectService.createProject).mockRejectedValue(apiError);

      await act(async () => {
        result.current.form.setValue("name", "Test");
        result.current.form.setValue("description", "Description");
        result.current.form.setValue("technologies", ["React"]);
        result.current.form.setValue("status", ProjectStatus.PLANNING);
      });

      // Act
      await act(async () => {
        await result.current.onSubmit(result.current.form.getValues());
      });

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });
  });

  describe("useProjectForm_should_transform_form_data_for_api", () => {
    it("should trim string values", () => {
      // Arrange
      const data = {
        name: "  Test Project  ",
        description: "  Description  ",
        technologies: ["  React  ", "  TypeScript  "],
        status: ProjectStatus.PLANNING,
        repoUrl: "  https://github.com/user/repo  ",
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const transformed = transformFormData(data);

      // Assert
      expect(transformed.name).toBe("Test Project");
      expect(transformed.description).toBe("Description");
      expect(transformed.technologies).toEqual(["React", "TypeScript"]);
      expect(transformed.repoUrl).toBe("https://github.com/user/repo");
    });

    it("should filter empty technologies", () => {
      // Arrange
      const data = {
        technologies: ["React", "", "  ", "TypeScript"],
      };

      // Act
      const transformed = transformFormData(data);

      // Assert
      expect(transformed.technologies).toEqual(["React", "TypeScript"]);
    });

    it("should convert empty strings to null for URLs", () => {
      // Arrange
      const data = {
        repoUrl: "",
        demoUrl: "  ",
        previewUrl: null,
      };

      // Act
      const transformed = transformFormData(data);

      // Assert
      expect(transformed.repoUrl).toBeNull();
      expect(transformed.demoUrl).toBeNull();
      expect(transformed.previewUrl).toBeNull();
    });
  });
});
