import React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface FileLinksInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (links: string[]) => void;
  isLoading: boolean;
  errors: string[];
}

/**
 * FileLinksInput - Textarea component for entering GitHub raw file links
 * Validates input and provides submit functionality
 */
export function FileLinksInput({ value, onChange, onSubmit, isLoading, errors }: FileLinksInputProps) {
  const handleSubmit = () => {
    const lines = value
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (lines.length > 0) {
      onSubmit(lines);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl/Cmd + Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Wklej linki do plików GitHub raw (jeden na linię)...&#10;Przykład:&#10;https://raw.githubusercontent.com/username/repo/main/src/index.ts"
          rows={6}
          disabled={isLoading}
          aria-label="Linki do plików GitHub raw"
          aria-describedby={errors.length > 0 ? "file-links-errors" : "file-links-help"}
          aria-invalid={errors.length > 0 ? "true" : "false"}
          className="font-mono text-sm"
        />
        <p id="file-links-help" className="text-xs text-muted-foreground">
          Maksymalnie 8 plików. Każdy plik musi być mniejszy niż 100 KB. Naciśnij Ctrl+Enter aby przesłać.
        </p>
      </div>

      {errors.length > 0 && (
        <Alert variant="destructive" id="file-links-errors" role="alert">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || value.trim().length === 0}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analizowanie...
            </>
          ) : (
            "Analizuj"
          )}
        </Button>
      </div>
    </div>
  );
}
