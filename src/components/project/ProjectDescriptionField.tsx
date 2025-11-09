import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

/**
 * ProjectDescriptionField - Form field for project description
 * Uses useFormContext to access form state
 */
export function ProjectDescriptionField() {
  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext<ProjectFormData>();

  const descriptionValue = useWatch({ name: "description" });
  const descriptionLength = descriptionValue?.length ?? 0;
  const minLength = 10;
  const maxLength = 1000;

  const hasError = !!errors.description;
  const isTouched = !!touchedFields.description;
  const isValid = isTouched && !hasError && descriptionLength >= minLength;

  return (
    <div className="space-y-2">
      <Label htmlFor="description">
        Opis <span className="text-destructive">*</span>
      </Label>
      <Textarea
        data-testid="project-description-textarea"
        id="description"
        {...register("description")}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? "description-error" : undefined}
        placeholder="Opisz swój projekt..."
        rows={5}
        maxLength={maxLength}
        className={isValid ? "border-green-500 dark:border-green-600" : ""}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {descriptionLength} / {maxLength} znaków (minimum {minLength})
        </p>
        {isValid && <p className="text-xs text-green-600 dark:text-green-500">✓ Wystarczająco długi</p>}
      </div>
      {hasError && (
        <p id="description-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
          {errors.description?.message}
        </p>
      )}
    </div>
  );
}
