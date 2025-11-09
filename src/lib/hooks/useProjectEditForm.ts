import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { UpdateProjectDto, ProjectDto } from "@/types";
import { createProjectFormSchema, transformFormData, mapServerErrorsToForm } from "@/lib/hooks/useProjectForm";
import { projectService } from "@/lib/services/project.service";
import { ErrorType, type ApiError } from "@/lib/utils/error.utils";

// Update form schema - partial schema for editing (all fields optional, but validate if provided)
const updateProjectFormSchema = createProjectFormSchema.partial().superRefine((data, ctx) => {
  // If technologies is provided, validate it has at least 1 item
  if (data.technologies !== undefined && data.technologies.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Musisz dodać co najmniej jedną technologię",
      path: ["technologies"],
    });
  }
});

export type UpdateProjectFormData = z.infer<typeof updateProjectFormSchema>;

// AI Error type for error handling
export interface AIErrorType {
  message: string;
  code?: number;
}

// Project edit state (ViewModel)
export interface ProjectEditState {
  project: ProjectDto | null;
  formData: UpdateProjectFormData;
  isLoading: boolean;
  isSubmitting: boolean;
  errors: AIErrorType[];
}

interface UseProjectEditFormReturn {
  form: ReturnType<typeof useForm<UpdateProjectFormData>>;
  isSubmitting: boolean;
  isLoading: boolean;
  project: ProjectDto | null;
  onSubmit: (data: UpdateProjectFormData) => Promise<void>;
  error: AIErrorType | null;
  queryCount: number;
}

/**
 * Custom hook for managing project edit form state and submission
 * Handles form validation, API integration (fetch, update), and error handling
 */
export function useProjectEditForm(projectId: string): UseProjectEditFormReturn {
  const form = useForm<UpdateProjectFormData>({
    resolver: zodResolver(updateProjectFormSchema),
    mode: "onChange",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [project, setProject] = React.useState<ProjectDto | null>(null);
  const [error, setError] = React.useState<AIErrorType | null>(null);
  const [queryCount, setQueryCount] = React.useState(0);

  // Fetch project data on mount
  React.useEffect(() => {
    const requestId = `fetch-project-${projectId}`;

    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch project using service
        const projectData = await projectService.getProject(projectId, requestId);
        setProject(projectData);

        // Pre-fill form with project data
        form.reset({
          name: projectData.name,
          description: projectData.description,
          technologies: projectData.technologies,
          status: projectData.status,
          repoUrl: projectData.repoUrl,
          demoUrl: projectData.demoUrl,
          previewUrl: projectData.previewUrl,
        });

        // Fetch query count for AI generation
        try {
          const count = await projectService.getProjectQueryCount(projectId);
          setQueryCount(count);
        } catch (queryCountError) {
          console.error("Error fetching query count:", queryCountError);
          // Don't fail the whole operation if query count fails
          setQueryCount(0);
        }
      } catch (error) {
        console.error("Error fetching project:", error);

        // Handle ApiError instances
        if (error && typeof error === "object" && "type" in error) {
          const apiError = error as ApiError;

          // Handle authentication errors
          if (apiError.type === ErrorType.AUTHENTICATION) {
            window.location.href = "/login";
            return;
          }

          // Handle not found errors
          if (apiError.statusCode === 404) {
            toast.error("Projekt nie został znaleziony");
            window.location.href = "/projects";
            return;
          }

          setError({ message: apiError.message });
          toast.error(apiError.message);
        } else {
          toast.error("Nie udało się pobrać projektu. Spróbuj ponownie.");
          setError({ message: "Nie udało się pobrać projektu" });
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }

    // Cleanup: cancel request on unmount or projectId change
    return () => {
      projectService.cancelRequest(requestId);
    };
  }, [projectId, form]);

  const onSubmit = async (data: UpdateProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform form data to UpdateProjectDto format using shared helper
      const updateData: UpdateProjectDto = transformFormData(data) as UpdateProjectDto;

      // Update project using service
      const updatedProject = await projectService.updateProject(projectId, updateData);
      setProject(updatedProject);

      // Success - show toast and redirect
      toast.success("Projekt został pomyślnie zaktualizowany");
      window.location.href = "/projects";
    } catch (error) {
      console.error("Error updating project:", error);

      // Handle ApiError instances
      if (error && typeof error === "object" && "type" in error) {
        const apiError = error as ApiError;

        // Handle authentication errors
        if (apiError.type === ErrorType.AUTHENTICATION) {
          window.location.href = "/login";
          return;
        }

        // Handle authorization errors
        if (apiError.type === ErrorType.AUTHORIZATION) {
          toast.error("Brak dostępu do tego projektu");
          window.location.href = "/projects";
          return;
        }

        // Handle not found errors
        if (apiError.statusCode === 404) {
          toast.error("Projekt nie został znaleziony");
          window.location.href = "/projects";
          return;
        }

        // Map server validation errors to form fields
        if (apiError.details && apiError.details.length > 0) {
          mapServerErrorsToForm(apiError.details, form);
        }

        // Show error toast
        toast.error(apiError.message);
        setError({ message: apiError.message });
        return;
      }

      // Handle unexpected errors
      toast.error("Nie udało się zaktualizować projektu. Spróbuj ponownie.");
      setError({ message: "Nie udało się zaktualizować projektu" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    isLoading,
    project,
    onSubmit,
    error,
    queryCount,
  };
}
