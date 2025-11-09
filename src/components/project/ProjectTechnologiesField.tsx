import React from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { X, Plus } from "lucide-react";
import { useTechnologyManagement } from "@/lib/hooks/useTechnologyManagement";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

/**
 * ProjectTechnologiesField - Form field for managing project technologies
 * Uses useFormContext and useTechnologyManagement hook
 */
export function ProjectTechnologiesField() {
  const form = useFormContext<ProjectFormData>();
  const {
    formState: { errors },
  } = form;

  const {
    technologies,
    newTechnology,
    setNewTechnology,
    addTechnology,
    removeTechnology,
    handleTechnologyKeyPress,
    canAddMore,
    isAtMax,
  } = useTechnologyManagement({
    form,
    maxTechnologies: 10,
  });

  const hasError = !!errors.technologies;
  const technologyCount = technologies.length;

  return (
    <div className="space-y-2">
      <Label htmlFor="technologies">
        Technologie <span className="text-destructive">*</span>
      </Label>
      <div className="flex flex-wrap gap-2 mb-2">
        {technologies.map((tech, index) => (
          <div
            key={`${tech}-${index}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-md text-sm"
          >
            <span>{tech}</span>
            <button
              type="button"
              onClick={() => removeTechnology(index)}
              className="ml-1 hover:text-destructive transition-colors cursor-pointer"
              aria-label={`Usuń ${tech}`}
            >
              <X className="size-3" />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          data-testid="new-technology-input"
          id="technologies"
          type="text"
          value={newTechnology}
          onChange={(e) => setNewTechnology(e.target.value)}
          onKeyPress={handleTechnologyKeyPress}
          placeholder="Dodaj technologię (Enter aby dodać)"
          maxLength={50}
          disabled={isAtMax}
        />
        <Button
          data-testid="add-technology-button"
          type="button"
          variant="outline"
          size="icon"
          onClick={addTechnology}
          disabled={!newTechnology.trim() || technologies.includes(newTechnology.trim()) || isAtMax}
          aria-label="Dodaj technologię"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      <div className="flex items-center justify-between">
        {isAtMax && <p className="text-xs text-muted-foreground">Maksymalnie 10 technologii</p>}
        {technologyCount > 0 && technologyCount < 10 && !hasError && (
          <p className="text-xs text-green-600 dark:text-green-500">
            ✓ {technologyCount} {technologyCount === 1 ? "technologia" : "technologie"}
          </p>
        )}
      </div>
      {hasError && (
        <p id="technologies-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
          {errors.technologies?.message}
        </p>
      )}
    </div>
  );
}
