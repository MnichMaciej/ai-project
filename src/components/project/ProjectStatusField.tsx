import React from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProjectStatus } from "@/types";
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "Planowanie",
  [ProjectStatus.IN_PROGRESS]: "W trakcie",
  [ProjectStatus.MVP_COMPLETED]: "MVP ukończony",
  [ProjectStatus.FINISHED]: "Zakończony",
};

/**
 * ProjectStatusField - Form field for project status
 * Uses useFormContext and Controller for Select component
 */
export function ProjectStatusField() {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProjectFormData>();

  const hasError = !!errors.status;

  return (
    <div className="space-y-2">
      <Label htmlFor="status">
        Status <span className="text-destructive">*</span>
      </Label>
      <Controller
        name="status"
        control={control}
        render={({ field }) => (
          <Select value={field.value} onValueChange={field.onChange}>
            <SelectTrigger data-testid="project-status-select" id="status" aria-invalid={hasError ? "true" : "false"}>
              <SelectValue placeholder="Wybierz status" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ProjectStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {statusLabels[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
      {hasError && (
        <p id="status-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
          {errors.status?.message}
        </p>
      )}
    </div>
  );
}
