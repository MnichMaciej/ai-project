import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

/**
 * ProjectNameField - Form field for project name
 * Uses useFormContext to access form state
 */
export function ProjectNameField() {
  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext<ProjectFormData>();

  const nameValue = useWatch({ name: "name" });

  const hasError = !!errors.name;
  const isTouched = !!touchedFields.name;
  const isValid = isTouched && !hasError && !!nameValue;

  return (
    <div className="space-y-2">
      <Label htmlFor="name">
        Nazwa projektu <span className="text-destructive">*</span>
      </Label>
      <Input
        data-testid="project-name-input"
        id="name"
        type="text"
        {...register("name")}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? "name-error" : undefined}
        placeholder="np. E-commerce Platform"
        maxLength={100}
        className={isValid ? "border-green-500 dark:border-green-600" : ""}
      />
      {hasError && (
        <p id="name-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
          {errors.name?.message}
        </p>
      )}
      {isValid && <p className="text-xs text-green-600 dark:text-green-500">Wygląda dobrze!</p>}
    </div>
  );
}
