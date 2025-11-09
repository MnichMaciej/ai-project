import React from "react";
import { useProjectEditForm } from "@/lib/hooks/useProjectEditForm";
import { ProjectForm } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";

interface ProjectEditViewProps {
  projectId: string;
  isAIEnabled?: boolean;
}

/**
 * ProjectEditView - Main container component for editing an existing project
 * Manages form state, API integration, and rendering ProjectForm
 */
export function ProjectEditView({ projectId, isAIEnabled = false }: ProjectEditViewProps) {
  const { form, isSubmitting, isLoading, onSubmit, error, queryCount } = useProjectEditForm(projectId);

  const handleCancel = () => {
    window.location.href = "/projects";
  };

  if (isLoading) {
    return (
      <>
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 max-w-4xl animate-in fade-in duration-300">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Ładowanie projektu...</p>
            </div>
          </div>
        </div>
        <MobileBottomNav variant="form" onBack={handleCancel} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 max-w-4xl animate-in fade-in duration-300">
          <div className="mb-4 md:mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="mb-2 md:mb-4 -ml-2 hidden md:flex"
              aria-label="Powrót do listy projektów"
            >
              <ArrowLeft className="size-4 mr-2" />
              Powrót
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Błąd</h1>
          </div>
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 md:p-4">
            <p className="text-destructive">{error.message}</p>
          </div>
        </div>
        <MobileBottomNav variant="form" onBack={handleCancel} />
      </>
    );
  }

  return (
    <>
      <div className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 max-w-4xl animate-in fade-in duration-300">
        <div className="mb-4 md:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-2 md:mb-4 -ml-2 hidden md:flex"
            aria-label="Powrót do listy projektów"
          >
            <ArrowLeft className="size-4 mr-2" />
            Powrót
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Edytuj projekt</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Zaktualizuj informacje o projekcie</p>
        </div>

        <ProjectForm
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          onCancel={handleCancel}
          mode="edit"
          projectId={projectId}
          initialQueryCount={queryCount}
          isAIEnabled={isAIEnabled}
        />
      </div>
      <MobileBottomNav variant="form" onBack={handleCancel} />
    </>
  );
}
