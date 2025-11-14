import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAIGeneration } from "@/lib/hooks/useAIGeneration";
import { toast } from "sonner";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";
import type { UseFormReturn } from "react-hook-form";

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

// Mock fetch
global.fetch = vi.fn();

// Mock useForm to return a mock form object with actual state tracking
const createMockForm = () => {
  const formState = {
    name: "",
    description: "",
    technologies: [] as string[],
    status: "PLANNING" as const,
    repoUrl: null as string | null,
    demoUrl: null as string | null,
    previewUrl: null as string | null,
  };

  const setValueFn = vi.fn((field: string, value: unknown) => {
    (formState as Record<string, unknown>)[field] = value;
    // Return a promise to simulate async behavior
    return Promise.resolve();
  });

  const getValuesFn = vi.fn((field?: string) => {
    if (field) {
      return (formState as Record<string, unknown>)[field];
    }
    return { ...formState } as CreateProjectFormData;
  });

  return {
    setValue: setValueFn,
    getValues: getValuesFn,
    watch: vi.fn(),
    getFieldState: vi.fn(),
    clearErrors: vi.fn(),
    resetField: vi.fn(),
    reset: vi.fn(),
    handleSubmit: vi.fn(),
    control: {} as unknown,
    register: vi.fn(),
    unregister: vi.fn(),
    setFocus: vi.fn(),
    subscribe: vi.fn(),
    formState: {
      errors: {},
      touchedFields: {},
      isDirty: false,
      dirtyFields: {},
      defaultValues: {},
      isSubmitted: false,
      isSubmitSuccessful: false,
      isValid: true,
      isValidating: false,
      submitCount: 0,
    },
    trigger: vi.fn(),
    setError: vi.fn(),
  } as unknown as UseFormReturn<CreateProjectFormData | UpdateProjectFormData>;
};

describe("useAIGeneration", () => {
  let mockForm: ReturnType<typeof createMockForm>;

  beforeEach(() => {
    // Suppress console.error output during tests (expected errors are being tested)
    vi.spyOn(console, "error").mockImplementation(() => {});

    vi.clearAllMocks();
    mockLocation.href = "";

    // Create a mock form
    mockForm = createMockForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("useAIGeneration_should_validate_github_raw_urls", () => {
    it("should validate correct GitHub raw URLs", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      const validLinks = [
        "https://raw.githubusercontent.com/user/repo/main/file.ts",
        "https://raw.githubusercontent.com/user/repo/branch/path/to/file.js",
      ];

      // Act
      const validation = result.current.validateLinks(validLinks.join("\n"));

      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject invalid URL format", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      const invalidLinks = ["https://github.com/user/repo/blob/main/file.ts"];

      // Act
      const validation = result.current.validateLinks(invalidLinks.join("\n"));

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should reject more than 8 files", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      const tooManyLinks = Array(9).fill("https://raw.githubusercontent.com/user/repo/main/file.ts").join("\n");

      // Act
      const validation = result.current.validateLinks(tooManyLinks);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("Maksymalnie 8"))).toBe(true);
    });

    it("should reject empty input", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      // Act
      const validation = result.current.validateLinks("");

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes("co najmniej jeden link"))).toBe(true);
    });
  });

  describe("useAIGeneration_should_enforce_query_limits", () => {
    it("should disable button when query limit reached", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          initialQueryCount: 5,
          form: mockForm,
        })
      );

      // Assert
      expect(result.current.isButtonDisabled).toBe(true);
    });

    it("should disable button when no projectId", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: null,
          form: mockForm,
        })
      );

      // Assert
      expect(result.current.isButtonDisabled).toBe(true);
    });

    it("should prevent opening input when limit reached", () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          initialQueryCount: 5,
          form: mockForm,
        })
      );

      // Act
      result.current.openInput();

      // Assert
      expect(toast.error).toHaveBeenCalledWith("Osiągnięto limit 5 zapytań na projekt");
      expect(result.current.state.isOpen).toBe(false);
    });
  });

  describe("useAIGeneration_should_handle_ai_generation_request", () => {
    it("should generate AI data successfully", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      const mockResponse = {
        success: true,
        description: "AI generated description",
        technologies: ["React", "TypeScript"],
        queryCount: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      // Act
      await act(async () => {
        await result.current.generateAI(fileLinks);
      });

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/projects/project-123/ai-generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ fileLinks }),
          signal: expect.any(AbortSignal),
        });
        expect(mockForm.getValues("description")).toBe("AI generated description");
        expect(mockForm.getValues("technologies")).toEqual(["React", "TypeScript"]);
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it("should handle 429 rate limit error", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({
          success: false,
          description: "",
          technologies: [],
          error: "Rate limit exceeded",
          queryCount: 0,
        }),
      });

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      // Act
      await act(async () => {
        await result.current.generateAI(fileLinks);
      });

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Osiągnięto limit 5 zapytań na projekt");
        expect(result.current.state.status).toBe("error");
      });
    });

    it("should handle 401 unauthorized error", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({
          success: false,
          description: "",
          technologies: [],
          error: "Unauthorized",
          queryCount: 0,
        }),
      });

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      // Act
      await act(async () => {
        await result.current.generateAI(fileLinks);
      });

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe("/login");
      });
    });
  });

  describe("useAIGeneration_should_manage_loading_states", () => {
    it("should set loading state during request", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      let resolveFetch: (value: Response) => void = () => {
        throw new Error("resolveFetch not implemented");
      };
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      // Act
      let generatePromise: Promise<void>;
      await act(async () => {
        generatePromise = result.current.generateAI(fileLinks);
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(true);
        expect(result.current.state.status).toBe("loading");
      });

      // Resolve fetch
      await act(async () => {
        resolveFetch({
          ok: true,
          json: async () => ({
            success: true,
            description: "Test",
            technologies: ["React"],
            queryCount: 1,
          }),
        } as Response);
        await generatePromise;
      });

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });
    });

    it("should cancel request on close", async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
        })
      );

      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise(() => {
          // Never resolve to simulate ongoing request
        });
      });

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];
      await act(async () => {
        result.current.generateAI(fileLinks);
      });

      // Act
      await act(async () => {
        result.current.closeInput();
      });

      // Assert
      await waitFor(() => {
        expect(result.current.state.isOpen).toBe(false);
      });
    });
  });

  describe("useAIGeneration_should_update_form_with_ai_data", () => {
    it("should update form fields with AI data", async () => {
      // Arrange
      const onUpdateProject = vi.fn();
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: "project-123",
          form: mockForm,
          onUpdateProject,
        })
      );

      const mockResponse = {
        success: true,
        description: "Updated description",
        technologies: ["Vue", "Nuxt"],
        queryCount: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      // Act
      await act(async () => {
        await result.current.generateAI(fileLinks);
      });

      // Assert
      await waitFor(() => {
        expect(mockForm.getValues("description")).toBe("Updated description");
        expect(mockForm.getValues("technologies")).toEqual(["Vue", "Nuxt"]);
        expect(onUpdateProject).toHaveBeenCalledWith({
          description: "Updated description",
          technologies: ["Vue", "Nuxt"],
        });
      });
    });
  });
});
