import React from "react";
import { useWatch } from "react-hook-form";
import type { UseFormReturn, FieldPath } from "react-hook-form";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

interface UseTechnologyManagementOptions {
  form: UseFormReturn<ProjectFormData>;
  maxTechnologies?: number;
}

interface UseTechnologyManagementReturn {
  technologies: string[];
  newTechnology: string;
  setNewTechnology: (value: string) => void;
  addTechnology: () => void;
  removeTechnology: (index: number) => void;
  handleTechnologyKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  canAddMore: boolean;
  isAtMax: boolean;
}

/**
 * Custom hook for managing technology list in project forms
 * Handles adding, removing, and validating technologies
 */
export function useTechnologyManagement({
  form,
  maxTechnologies = 10,
}: UseTechnologyManagementOptions): UseTechnologyManagementReturn {
  const { control, setValue } = form;

  // Use useWatch to only re-render when technologies change
  const technologies = useWatch({
    control,
    name: "technologies" as FieldPath<ProjectFormData>,
    defaultValue: [],
  }) as string[];

  const [newTechnology, setNewTechnology] = React.useState("");

  const addTechnology = React.useCallback(() => {
    const trimmed = newTechnology.trim();
    if (trimmed && !technologies?.includes(trimmed)) {
      setValue("technologies", [...(technologies ?? []), trimmed], { shouldValidate: true });
      setNewTechnology("");
    }
  }, [newTechnology, technologies, setValue]);

  const removeTechnology = React.useCallback(
    (index: number) => {
      const updated = technologies?.filter((_, i) => i !== index) ?? [];
      setValue("technologies", updated, { shouldValidate: true });
    },
    [technologies, setValue]
  );

  const handleTechnologyKeyPress = React.useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTechnology();
      }
    },
    [addTechnology]
  );

  const currentCount = technologies?.length ?? 0;
  const canAddMore = currentCount < maxTechnologies;
  const isAtMax = currentCount >= maxTechnologies;

  return {
    technologies: technologies ?? [],
    newTechnology,
    setNewTechnology,
    addTechnology,
    removeTechnology,
    handleTechnologyKeyPress,
    canAddMore,
    isAtMax,
  };
}
