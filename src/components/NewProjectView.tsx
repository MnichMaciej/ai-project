import { useProjectForm } from "@/lib/hooks/useProjectForm";
import { ProjectForm } from "@/components/ProjectForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { MobileBottomNav } from "@/components/MobileBottomNav";

/**
 * NewProjectView - Main container component for creating a new project
 * Manages form state, API integration, and rendering ProjectForm
 */
export function NewProjectView() {
  const { form, isSubmitting, onSubmit } = useProjectForm();

  const handleCancel = () => {
    window.location.href = "/projects";
  };

  return (
    <>
      <div
        data-testid="new-project-container"
        className="container mx-auto px-3 py-4 md:px-4 md:py-8 pb-24 md:pb-8 max-w-4xl animate-in fade-in duration-300"
      >
        <div className="mb-4 md:mb-6">
          <Button
            data-testid="back-to-projects-button"
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="mb-2 md:mb-4 -ml-2 hidden md:flex"
            aria-label="Powrót do listy projektów"
          >
            <ArrowLeft className="size-4 mr-2" />
            Powrót
          </Button>
          <h1 data-testid="new-project-title" className="text-2xl md:text-3xl font-bold tracking-tight">
            Dodaj nowy projekt
          </h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">Wypełnij formularz, aby dodać nowy projekt do portfolio</p>
        </div>

        <ProjectForm form={form} onSubmit={onSubmit} isSubmitting={isSubmitting} onCancel={handleCancel} />
      </div>
      <MobileBottomNav variant="form" onBack={handleCancel} />
    </>
  );
}
