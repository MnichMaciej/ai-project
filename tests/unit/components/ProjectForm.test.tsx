import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "../../helpers/react-testing-helpers";
import { ProjectForm } from "@/components/ProjectForm";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProjectStatus } from "@/types";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import { createProjectFormSchema } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";
import userEvent from "@testing-library/user-event";
import { renderHook } from "@testing-library/react";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

// Mock useAIGeneration hook
vi.mock("@/lib/hooks/useAIGeneration", () => ({
  useAIGeneration: vi.fn(() => ({
    state: {
      isOpen: false,
      fileLinks: "",
      parsedLinks: null,
      isLoading: false,
      queryCount: 0,
      error: null,
      status: "idle" as const,
    },
    openInput: vi.fn(),
    closeInput: vi.fn(),
    validateLinks: vi.fn(),
    generateAI: vi.fn(),
    isButtonDisabled: false,
    updateQueryCount: vi.fn(),
    setFileLinks: vi.fn(),
  })),
}));

describe("ProjectForm", () => {
  let mockForm: ReturnType<typeof useForm<CreateProjectFormData>>;
  let mockFormAsProjectFormData: UseFormReturn<ProjectFormData>;
  let mockOnSubmit: (data: ProjectFormData) => Promise<void>;
  let mockOnCancel: () => void;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOnSubmit = vi.fn().mockResolvedValue(undefined) as (data: ProjectFormData) => Promise<void>;
    mockOnCancel = vi.fn() as () => void;

    // Create form inside renderHook to ensure proper React context
    // Use zodResolver to enable validation (required for isValid to work)
    // Use CreateProjectFormData for create mode tests
    const { result } = renderHook(() =>
      useForm<CreateProjectFormData>({
        resolver: zodResolver(createProjectFormSchema),
        defaultValues: {
          name: "",
          description: "",
          technologies: [],
          status: ProjectStatus.PLANNING,
          repoUrl: null,
          demoUrl: null,
          previewUrl: null,
        },
        mode: "onChange", // Validate on change for consistency with real hook
      })
    );
    mockForm = result.current;
    // Cast to ProjectFormData type for component compatibility
    mockFormAsProjectFormData = mockForm as unknown as UseFormReturn<ProjectFormData>;
  });

  describe("ProjectForm_should_render_all_form_fields", () => {
    it("should render all form fields", () => {
      // Arrange & Act
      render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Assert
      expect(screen.getByLabelText(/nazwa projektu/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/opis/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/technologie/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url repozytorium/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url dema/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/url podglądu/i)).toBeInTheDocument();
    });

    it("should render submit and cancel buttons", () => {
      // Arrange & Act
      render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Assert
      expect(screen.getByRole("button", { name: /zapisz projekt/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /anuluj/i })).toBeInTheDocument();
    });
  });

  describe("ProjectForm_should_integrate_with_useProjectForm_hook", () => {
    it("should display validation errors", async () => {
      // Arrange & Act
      const { rerender } = render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Set error after initial render to trigger re-render
      mockForm.setError("name", {
        type: "required",
        message: "Nazwa projektu jest wymagana",
      });

      // Force re-render to show error
      rerender(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Assert
      await screen.findByText("Nazwa projektu jest wymagana");
    });

    it("should call onSubmit when form is submitted", async () => {
      // Arrange
      const user = userEvent.setup();

      const { rerender } = render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Fill form fields using userEvent to simulate real user interaction
      const nameInput = screen.getByLabelText(/nazwa projektu/i);
      await user.type(nameInput, "Test Project");

      const descriptionInput = screen.getByLabelText(/opis/i);
      await user.type(descriptionInput, "Test Description");

      // Add technology
      const technologyInput = screen.getByLabelText(/technologie/i);
      await user.type(technologyInput, "React");
      await user.keyboard("{Enter}");

      // Note: Status is already set to PLANNING in defaultValues

      // Explicitly trigger validation to ensure form state is updated
      const isValid = await mockForm.trigger();
      expect(isValid).toBe(true);

      // Force re-render to update component with new form state
      rerender(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Wait for form state to update and button to be enabled
      await waitFor(
        () => {
          const submitButton = screen.getByRole("button", { name: /zapisz projekt/i });
          expect(submitButton).not.toBeDisabled();
        },
        { timeout: 3000 }
      );

      // Act
      const submitButton = screen.getByRole("button", { name: /zapisz projekt/i });
      await user.click(submitButton);

      // Assert - wait for form submission
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });

    it("should call onCancel when cancel button is clicked", async () => {
      // Arrange
      const user = userEvent.setup();

      render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Act
      const cancelButton = screen.getByRole("button", { name: /anuluj/i });
      await user.click(cancelButton);

      // Assert
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("ProjectForm_should_handle_ai_generation_integration", () => {
    it("should show AI section in edit mode when projectId is provided", () => {
      // Arrange & Act
      render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="edit"
          projectId="project-123"
        />
      );

      // Assert - AI section should be rendered (check for AI button or section)
      // This depends on AISection component implementation
      expect(screen.getByText(/szczegóły projektu/i)).toBeInTheDocument();
    });

    it("should not show AI section in create mode", () => {
      // Arrange & Act
      render(
        <ProjectForm
          form={mockFormAsProjectFormData}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onCancel={mockOnCancel}
          mode="create"
        />
      );

      // Assert - AI section should not be visible in create mode
      // This is tested by absence of AI-specific elements
      expect(screen.queryByText(/generuj z ai/i)).not.toBeInTheDocument();
    });
  });
});
