import React from "react";
import { FormProvider, useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, InfoIcon } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

// Form data types - matches the schema from hooks
import type { CreateProjectFormData } from "@/lib/hooks/useProjectForm";
import type { UpdateProjectFormData } from "@/lib/hooks/useProjectEditForm";
import { AISection } from "@/components/ai/AISection";
import { useAIGeneration } from "@/lib/hooks/useAIGeneration";

// Field components
import { ProjectNameField } from "@/components/project/ProjectNameField";
import { ProjectDescriptionField } from "@/components/project/ProjectDescriptionField";
import { ProjectTechnologiesField } from "@/components/project/ProjectTechnologiesField";
import { ProjectStatusField } from "@/components/project/ProjectStatusField";
import { ProjectUrlField } from "@/components/project/ProjectUrlField";

type ProjectFormData = CreateProjectFormData | UpdateProjectFormData;

interface ProjectFormProps {
  form: UseFormReturn<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
  mode?: "create" | "edit";
  projectId?: string | null;
  initialQueryCount?: number;
  isAIEnabled?: boolean;
}

/**
 * ProjectFormFields - Internal component that uses form context
 * Separated to allow FormProvider wrapping
 */
function ProjectFormFields({
  mode,
  projectId,
  initialQueryCount,
  isAIEnabled,
}: {
  mode: "create" | "edit";
  projectId: string | null;
  initialQueryCount: number;
  isAIEnabled: boolean;
}) {
  const form = useFormContext<ProjectFormData>();

  // AI Generation hook
  const aiGeneration = useAIGeneration({
    projectId,
    initialQueryCount,
    form,
  });

  return (
    <>
      <ProjectNameField />
      <ProjectDescriptionField />
      <ProjectTechnologiesField />

      {/* AI Section - Only show in edit mode or when projectId is available */}
      {mode === "edit" && projectId && isAIEnabled && (
        <AISection
          projectId={projectId}
          queryCount={aiGeneration.state.queryCount}
          aiState={aiGeneration.state}
          onOpenInput={aiGeneration.openInput}
          onCloseInput={aiGeneration.closeInput}
          onFileLinksChange={aiGeneration.setFileLinks}
          onFileLinksSubmit={aiGeneration.generateAI}
          onValidateLinks={aiGeneration.validateLinks}
        />
      )}

      <ProjectStatusField />
      <ProjectUrlField
        fieldName="repoUrl"
        label="URL repozytorium"
        placeholder="https://github.com/username/repo"
        testId="project-repo-url-input"
      />
      <ProjectUrlField
        fieldName="demoUrl"
        label="URL dema"
        placeholder="https://example.com"
        testId="project-demo-url-input"
      />
      <ProjectUrlField
        fieldName="previewUrl"
        label="URL podglądu (obraz)"
        placeholder="https://example.com/image.png"
        testId="project-preview-url-input"
      />
    </>
  );
}

/**
 * ProjectForm - Main form component for creating/editing projects
 * Uses FormProvider to provide form context to field components
 */
export function ProjectForm({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
  mode = "create",
  projectId = null,
  initialQueryCount = 0,
  isAIEnabled = false,
}: ProjectFormProps) {
  const {
    handleSubmit,
    formState: { isValid },
  } = form;

  return (
    <Card data-testid="project-form" className="py-3 md:py-6 gap-3 md:gap-6">
      <CardHeader className="px-3 md:px-6">
        <CardTitle className="text-lg md:text-xl">Szczegóły projektu</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          {mode === "edit" ? "Edytuj informacje o projekcie" : "Wypełnij wszystkie wymagane pola, aby dodać projekt"}
        </CardDescription>
      </CardHeader>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4 md:space-y-6 px-3 md:px-6">
            {mode === "create" && (
              <Alert className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
                <InfoIcon className="text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-900 dark:text-blue-100">
                  Funkcja AI dostępna po utworzeniu projektu
                </AlertTitle>
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Wypełnienie technologii i opisu za pomocą AI będzie dostępne dopiero na etapie edycji projektu. Najpierw utwórz projekt, a następnie przejdź do jego edycji, aby skorzystać z asystenta AI.
                </AlertDescription>
              </Alert>
            )}
            <ProjectFormFields
              mode={mode}
              projectId={projectId}
              initialQueryCount={initialQueryCount}
              isAIEnabled={isAIEnabled}
            />
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 md:gap-4 mt-4 md:mt-8 px-3 md:px-6">
            <Button
              data-testid="cancel-project-button"
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              Anuluj
            </Button>
            <Button
              data-testid="submit-project-button"
              type="submit"
              disabled={isSubmitting || !isValid}
              className="w-full sm:w-auto text-xs md:text-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3 md:size-4 mr-2 animate-spin" />
                  Zapisywanie...
                </>
              ) : mode === "edit" ? (
                "Zaktualizuj projekt"
              ) : (
                "Zapisz projekt"
              )}
            </Button>
          </CardFooter>
        </form>
      </FormProvider>
    </Card>
  );
}
