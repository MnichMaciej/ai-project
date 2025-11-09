import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AIGenerateButton } from "./AIGenerateButton";
import { FileLinksInput } from "./FileLinksInput";
import { AIProgressIndicator } from "./AIProgressIndicator";
import { AILimitInfo } from "./AILimitInfo";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { AIState, FileLinksValidation } from "@/lib/hooks/useAIGeneration";

interface AISectionProps {
  projectId: string | null;
  queryCount: number;
  aiState: AIState;
  onOpenInput: () => void;
  onCloseInput: () => void;
  onFileLinksChange: (value: string) => void;
  onFileLinksSubmit: (links: string[]) => void;
  onValidateLinks: (input: string) => FileLinksValidation;
}

/**
 * AISection - Main section component for AI generation feature
 * Integrates all AI-related components and manages their interactions
 */
export function AISection({
  projectId,
  aiState,
  onOpenInput,
  onCloseInput,
  onFileLinksChange,
  onFileLinksSubmit,
  onValidateLinks,
}: AISectionProps) {
  const [validationErrors, setValidationErrors] = React.useState<string[]>([]);

  const handleFileLinksChange = (value: string) => {
    onFileLinksChange(value);
    // Validate on change and show errors
    const validation = onValidateLinks(value);
    setValidationErrors(validation.errors);
  };

  const handleFileLinksSubmit = (links: string[]) => {
    const validation = onValidateLinks(links.join("\n"));
    if (!validation.valid) {
      setValidationErrors(validation.errors);
      return;
    }

    setValidationErrors([]);
    onFileLinksSubmit(links);
  };

  // Don't render if no projectId (for new projects)
  if (!projectId) {
    return null;
  }

  return (
    <Card className="border-dashed py-3 md:py-6 gap-3 md:gap-6">
      <CardHeader className="px-3 md:px-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base md:text-lg">Generowanie danych za pomocą AI</CardTitle>
            <CardDescription className="text-xs md:text-sm">
              Automatycznie wygeneruj opis i technologie na podstawie analizy kodu z GitHub
            </CardDescription>
          </div>
          {aiState.isOpen && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onCloseInput}
              aria-label="Zamknij sekcję AI"
              className="size-8 md:size-10"
            >
              <X className="size-3 md:size-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4 px-3 md:px-6">
        {!aiState.isOpen ? (
          <>
            <AIGenerateButton
              onClick={onOpenInput}
              disabled={aiState.queryCount >= 5 || aiState.isLoading}
              queryCount={aiState.queryCount}
            />
            <AILimitInfo queryCount={aiState.queryCount} />
          </>
        ) : (
          <>
            <FileLinksInput
              value={aiState.fileLinks}
              onChange={handleFileLinksChange}
              onSubmit={handleFileLinksSubmit}
              isLoading={aiState.isLoading}
              errors={validationErrors}
            />
            <AIProgressIndicator status={aiState.status} message={aiState.error || undefined} />
            {aiState.status === "success" && (
              <div className="pt-1 md:pt-2">
                <AILimitInfo queryCount={aiState.queryCount} />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
