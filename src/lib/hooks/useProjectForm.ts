import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import type { CreateProjectDto } from "@/types";
import { ProjectStatus as ProjectStatusEnum } from "@/types";

// Extended client-side validation schema with stricter rules
const createProjectFormSchema = z.object({
  name: z.string().min(1, "Nazwa projektu jest wymagana").max(100, "Nazwa projektu nie może przekraczać 100 znaków"),
  description: z
    .string()
    .min(10, "Opis musi mieć co najmniej 10 znaków")
    .max(1000, "Opis nie może przekraczać 1000 znaków"),
  technologies: z
    .array(z.string().min(1, "Technologia nie może być pusta"))
    .min(1, "Musisz dodać co najmniej jedną technologię")
    .max(10, "Możesz dodać maksymalnie 10 technologii")
    .refine((arr) => arr.length === new Set(arr).size, {
      message: "Technologie muszą być unikalne",
    }),
  status: z.nativeEnum(ProjectStatusEnum),
  repoUrl: z
    .union([z.string(), z.null()])
    .transform((val) => (val === "" || val === null ? null : val))
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: "Nieprawidłowy format URL",
    }),
  demoUrl: z
    .union([z.string(), z.null()])
    .transform((val) => (val === "" || val === null ? null : val))
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: "Nieprawidłowy format URL",
    }),
  previewUrl: z
    .union([z.string(), z.null()])
    .transform((val) => (val === "" || val === null ? null : val))
    .refine((val) => val === null || z.string().url().safeParse(val).success, {
      message: "Nieprawidłowy format URL",
    }),
});

type CreateProjectFormData = z.infer<typeof createProjectFormSchema>;

// Export the type for use in components
export type { CreateProjectFormData };

interface UseProjectFormReturn {
  form: ReturnType<typeof useForm<CreateProjectFormData>>;
  isSubmitting: boolean;
  onSubmit: (data: CreateProjectFormData) => Promise<void>;
}

/**
 * Custom hook for managing project form state and submission
 * Handles form validation, API integration, and error handling
 */
export function useProjectForm(): UseProjectFormReturn {
  const form = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectFormSchema),
    defaultValues: {
      name: "",
      description: "",
      technologies: [],
      status: ProjectStatusEnum.PLANNING,
      repoUrl: null,
      demoUrl: null,
      previewUrl: null,
    },
    mode: "onChange", // Validate on change for live feedback
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: CreateProjectFormData) => {
    setIsSubmitting(true);

    try {
      // Transform form data to CreateProjectDto format
      const projectData: CreateProjectDto = {
        name: data.name.trim(),
        description: data.description.trim(),
        technologies: data.technologies.map((tech) => tech.trim()).filter((tech) => tech.length > 0),
        status: data.status,
        repoUrl: data.repoUrl?.trim() || null,
        demoUrl: data.demoUrl?.trim() || null,
        previewUrl: data.previewUrl?.trim() || null,
      };

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(projectData),
      });

      if (!response.ok) {
        // Handle error responses
        let errorMessage = "Nie udało się utworzyć projektu";
        let errorDetails: string[] | undefined;

        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          errorDetails = errorData.details;

          // Map server validation errors to form fields
          if (errorDetails && Array.isArray(errorDetails)) {
            errorDetails.forEach((detail) => {
              const match = detail.match(/^([^.]+):\s*(.+)$/);
              if (match) {
                const [, fieldPath, message] = match;
                const fieldName = fieldPath.split(".")[0] as keyof CreateProjectFormData;
                form.setError(fieldName, { type: "server", message });
              }
            });
          }
        } catch {
          // If parsing fails, use default error message
        }

        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }

        toast.error(errorMessage);
        return;
      }

      // Success - show toast and redirect
      toast.success("Projekt został pomyślnie dodany");
      window.location.href = "/projects";
    } catch (error) {
      console.error("Error creating project:", error);

      // Handle network errors
      if (error instanceof Error && error.message.includes("fetch")) {
        toast.error("Błąd połączenia z serwerem. Sprawdź połączenie internetowe.");
      } else {
        toast.error("Nie udało się utworzyć projektu. Spróbuj ponownie.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    form,
    isSubmitting,
    onSubmit,
  };
}
