import React from "react";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { AIStatus } from "@/lib/hooks/useAIGeneration";

interface AIProgressIndicatorProps {
  status: AIStatus;
  progress?: number;
  message?: string;
}

/**
 * AIProgressIndicator - Component for displaying AI generation progress
 * Shows loading state, success, or error messages with appropriate icons
 */
export function AIProgressIndicator({ status, progress, message }: AIProgressIndicatorProps) {
  if (status === "idle") {
    return null;
  }

  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-atomic="true">
      {status === "loading" && (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <span>{message || "Analiza plików w toku..."}</span>
          </div>
          {progress !== undefined && <Progress value={progress} className="h-2" aria-label="Postęp generowania AI" />}
        </>
      )}

      {status === "success" && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="size-4 text-green-600 dark:text-green-500" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {message || "Dane wygenerowane pomyślnie! Edytuj przed zapisaniem."}
          </AlertDescription>
        </Alert>
      )}

      {status === "error" && message && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
