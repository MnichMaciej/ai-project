import React from "react";
import { useProjectEditForm } from "@/lib/hooks/useProjectEditForm";
import { ProjectForm } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";

interface ProjectEditViewProps {
  projectId: string;
}

/**
 * ProjectEditView - Main container component for editing an existing project
 * Manages form state, API integration, and rendering ProjectForm
 */
export function ProjectEditView({ projectId }: ProjectEditViewProps) {
  const { form, isSubmitting, isLoading, onSubmit, error } = useProjectEditForm(projectId);

  const handleCancel = () => {
    window.location.href = "/projects";
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-muted-foreground">Ładowanie projektu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-4 -ml-2"
            aria-label="Powrót do listy projektów"
          >
            <ArrowLeft className="size-4 mr-2" />
            Powrót
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Błąd</h1>
        </div>
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-destructive">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl animate-in fade-in duration-300">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          className="mb-4 -ml-2"
          aria-label="Powrót do listy projektów"
        >
          <ArrowLeft className="size-4 mr-2" />
          Powrót
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edytuj projekt</h1>
        <p className="text-muted-foreground mt-2">Zaktualizuj informacje o projekcie</p>
      </div>

      <ProjectForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} onCancel={handleCancel} mode="edit" />
    </div>
  );
}

