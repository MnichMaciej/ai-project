import React from "react";
import { Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ProjectStatus } from "@/types";
import { X, Plus, Loader2 } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

// Form data type - matches the schema from useProjectForm
// Import the type from the hook to ensure consistency
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";

type ProjectFormData = CreateProjectFormData;

interface ProjectFormProps {
  form: UseFormReturn<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const statusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.PLANNING]: "Planowanie",
  [ProjectStatus.IN_PROGRESS]: "W trakcie",
  [ProjectStatus.MVP_COMPLETED]: "MVP ukończony",
  [ProjectStatus.FINISHED]: "Zakończony",
};

/**
 * ProjectForm - Main form component for creating/editing projects
 * Handles all form fields, validation, and submission
 */
export function ProjectForm({ form, onSubmit, isSubmitting, onCancel }: ProjectFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, touchedFields, isValid },
    control,
    watch,
    setValue,
  } = form;

  const watchedTechnologies = watch("technologies");
  const [newTechnology, setNewTechnology] = React.useState("");

  const handleAddTechnology = () => {
    const trimmed = newTechnology.trim();
    if (trimmed && !watchedTechnologies.includes(trimmed)) {
      setValue("technologies", [...watchedTechnologies, trimmed], { shouldValidate: true });
      setNewTechnology("");
    }
  };

  const handleRemoveTechnology = (index: number) => {
    const updated = watchedTechnologies.filter((_, i) => i !== index);
    setValue("technologies", updated, { shouldValidate: true });
  };

  const handleTechnologyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTechnology();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Szczegóły projektu</CardTitle>
        <CardDescription>Wypełnij wszystkie wymagane pola, aby dodać projekt</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Nazwa projektu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              aria-invalid={errors.name ? "true" : "false"}
              aria-describedby={errors.name ? "name-error" : undefined}
              placeholder="np. E-commerce Platform"
              maxLength={100}
              className={
                touchedFields.name && !errors.name && watch("name") ? "border-green-500 dark:border-green-600" : ""
              }
            />
            {errors.name && (
              <p id="name-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.name.message}
              </p>
            )}
            {touchedFields.name && !errors.name && watch("name") && (
              <p className="text-xs text-green-600 dark:text-green-500">Wygląda dobrze!</p>
            )}
          </div>

          {/* Description Input */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Opis <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              aria-invalid={errors.description ? "true" : "false"}
              aria-describedby={errors.description ? "description-error" : undefined}
              placeholder="Opisz swój projekt..."
              rows={5}
              maxLength={1000}
              className={
                touchedFields.description && !errors.description && watch("description")?.length >= 10
                  ? "border-green-500 dark:border-green-600"
                  : ""
              }
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {watch("description")?.length || 0} / 1000 znaków (minimum 10)
              </p>
              {touchedFields.description && !errors.description && watch("description")?.length >= 10 && (
                <p className="text-xs text-green-600 dark:text-green-500">✓ Wystarczająco długi</p>
              )}
            </div>
            {errors.description && (
              <p
                id="description-error"
                className="text-sm text-destructive animate-in slide-in-from-top-1"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Technologies Input */}
          <div className="space-y-2">
            <Label htmlFor="technologies">
              Technologie <span className="text-destructive">*</span>
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {watchedTechnologies.map((tech, index) => (
                <div
                  key={`${tech}-${index}`}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-md text-sm"
                >
                  <span>{tech}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTechnology(index)}
                    className="ml-1 hover:text-destructive transition-colors"
                    aria-label={`Usuń ${tech}`}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="technologies"
                type="text"
                value={newTechnology}
                onChange={(e) => setNewTechnology(e.target.value)}
                onKeyPress={handleTechnologyKeyPress}
                placeholder="Dodaj technologię (Enter aby dodać)"
                maxLength={50}
                disabled={watchedTechnologies.length >= 10}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleAddTechnology}
                disabled={
                  !newTechnology.trim() ||
                  watchedTechnologies.includes(newTechnology.trim()) ||
                  watchedTechnologies.length >= 10
                }
                aria-label="Dodaj technologię"
              >
                <Plus className="size-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              {watchedTechnologies.length >= 10 && (
                <p className="text-xs text-muted-foreground">Maksymalnie 10 technologii</p>
              )}
              {watchedTechnologies.length > 0 && watchedTechnologies.length < 10 && !errors.technologies && (
                <p className="text-xs text-green-600 dark:text-green-500">
                  ✓ {watchedTechnologies.length} {watchedTechnologies.length === 1 ? "technologia" : "technologie"}
                </p>
              )}
            </div>
            {errors.technologies && (
              <p
                id="technologies-error"
                className="text-sm text-destructive animate-in slide-in-from-top-1"
                role="alert"
              >
                {errors.technologies.message}
              </p>
            )}
          </div>

          {/* Status Select */}
          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="status" aria-invalid={errors.status ? "true" : "false"}>
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
            {errors.status && (
              <p id="status-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.status.message}
              </p>
            )}
          </div>

          {/* Repo URL Input */}
          <div className="space-y-2">
            <Label htmlFor="repoUrl">URL repozytorium</Label>
            <Input
              id="repoUrl"
              type="url"
              {...register("repoUrl", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
              aria-invalid={errors.repoUrl ? "true" : "false"}
              aria-describedby={errors.repoUrl ? "repoUrl-error" : undefined}
              placeholder="https://github.com/username/repo"
              defaultValue={watch("repoUrl") || ""}
            />
            {errors.repoUrl && (
              <p id="repoUrl-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.repoUrl.message}
              </p>
            )}
            {touchedFields.repoUrl && !errors.repoUrl && watch("repoUrl") && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format URL</p>
            )}
          </div>

          {/* Demo URL Input */}
          <div className="space-y-2">
            <Label htmlFor="demoUrl">URL dema</Label>
            <Input
              id="demoUrl"
              type="url"
              {...register("demoUrl", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
              aria-invalid={errors.demoUrl ? "true" : "false"}
              aria-describedby={errors.demoUrl ? "demoUrl-error" : undefined}
              placeholder="https://example.com"
              defaultValue={watch("demoUrl") || ""}
              className={
                touchedFields.demoUrl && !errors.demoUrl && watch("demoUrl")
                  ? "border-green-500 dark:border-green-600"
                  : ""
              }
            />
            {errors.demoUrl && (
              <p id="demoUrl-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.demoUrl.message}
              </p>
            )}
            {touchedFields.demoUrl && !errors.demoUrl && watch("demoUrl") && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format URL</p>
            )}
          </div>

          {/* Preview URL Input */}
          <div className="space-y-2">
            <Label htmlFor="previewUrl">URL podglądu (obraz)</Label>
            <Input
              id="previewUrl"
              type="url"
              {...register("previewUrl", {
                setValueAs: (value) => (value === "" ? null : value),
              })}
              aria-invalid={errors.previewUrl ? "true" : "false"}
              aria-describedby={errors.previewUrl ? "previewUrl-error" : undefined}
              placeholder="https://example.com/image.png"
              defaultValue={watch("previewUrl") || ""}
              className={
                touchedFields.previewUrl && !errors.previewUrl && watch("previewUrl")
                  ? "border-green-500 dark:border-green-600"
                  : ""
              }
            />
            {errors.previewUrl && (
              <p id="previewUrl-error" className="text-sm text-destructive animate-in slide-in-from-top-1" role="alert">
                {errors.previewUrl.message}
              </p>
            )}
            {touchedFields.previewUrl && !errors.previewUrl && watch("previewUrl") && (
              <p className="text-xs text-green-600 dark:text-green-500">✓ Poprawny format URL</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-4 mt-8">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Anuluj
          </Button>
          <Button type="submit" disabled={isSubmitting || !isValid} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Zapisywanie...
              </>
            ) : (
              "Zapisz projekt"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
