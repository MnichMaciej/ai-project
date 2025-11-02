import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { UpdateProjectDto, ProjectDto } from "@/types";
import { createProjectFormSchema, transformFormData, mapServerErrorsToForm } from "@/lib/hooks/useProjectForm";

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

  // Fetch project data on mount
  React.useEffect(() => {
    const fetchProject = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            window.location.href = "/login";
            return;
          }
          if (response.status === 404) {
            toast.error("Projekt nie został znaleziony");
            window.location.href = "/projects";
            return;
          }
          throw new Error("Nie udało się pobrać projektu");
        }

        const projectData: ProjectDto = await response.json();
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
      } catch (error) {
        console.error("Error fetching project:", error);
        toast.error("Nie udało się pobrać projektu. Spróbuj ponownie.");
        setError({ message: error instanceof Error ? error.message : "Nie udało się pobrać projektu" });
      } finally {
        setIsLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId, form]);

  const onSubmit = async (data: UpdateProjectFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform form data to UpdateProjectDto format using shared helper
      const updateData: UpdateProjectDto = transformFormData(data) as UpdateProjectDto;

      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        let errorMessage = "Nie udało się zaktualizować projektu";
        let errorDetails: string[] | undefined;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details;

          // Map server validation errors to form fields using shared helper
          mapServerErrorsToForm(errorDetails, form);
        } catch {
          // If parsing fails, use default error message
        }

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        if (response.status === 403) {
          toast.error("Brak dostępu do tego projektu");
          window.location.href = "/projects";
          return;
        }

        if (response.status === 404) {
          toast.error("Projekt nie został znaleziony");
          window.location.href = "/projects";
          return;
        }

        toast.error(errorMessage);
        return;
      }

      const updatedProject: ProjectDto = await response.json();
      setProject(updatedProject);

      // Success - show toast and redirect
      toast.success("Projekt został pomyślnie zaktualizowany");
      window.location.href = "/projects";
    } catch (error) {
      console.error("Error updating project:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
        setError({ message: "Błąd połączenia z serwerem" });
      } else {
        toast.error("Nie udało się zaktualizować projektu. Spróbuj ponownie.");
        setError({ message: "Nie udało się zaktualizować projektu" });
      }
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
  };
}
