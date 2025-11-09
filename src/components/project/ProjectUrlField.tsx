import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

interface ProjectUrlFieldProps {
  fieldName: "repoUrl" | "demoUrl" | "previewUrl";
  label: string;
  placeholder: string;
  testId: string;
}

/**
 * ProjectUrlField - Reusable form field for URL inputs (repo, demo, preview)
 * Uses useFormContext to access form state
 */
export function ProjectUrlField({ fieldName, label, placeholder, testId }: ProjectUrlFieldProps) {
  const {
    register,
    formState: { errors, touchedFields },
  } = useFormContext<ProjectFormData>();

  const urlValue = useWatch({ name: fieldName });

  const hasError = !!errors[fieldName];
  const isTouched = !!touchedFields[fieldName];
  const isValid = isTouched && !hasError && !!urlValue;

  return (
    <div className="space-y-2">
      <Label htmlFor={fieldName}>{label}</Label>
      <Input
        data-testid={testId}
        id={fieldName}
        type="url"
        {...register(fieldName, {
          setValueAs: (value) => (value === "" ? null : value),
        })}
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${fieldName}-error` : undefined}
        placeholder={placeholder}
        defaultValue={urlValue || ""}
        className={isValid ? "border-green-500 dark:border-green-600" : ""}
      />
      {hasError && (
        <p id={`${fieldName}-error`} className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
          {errors[fieldName]?.message}
        </p>
      )}
      {isValid && <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format URL</p>}
    </div>
  );
}
