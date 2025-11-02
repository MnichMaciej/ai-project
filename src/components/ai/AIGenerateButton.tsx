import React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AIGenerateButtonProps {
  onClick: () => void;
  disabled: boolean;
  queryCount: number;
}

/**
 * AIGenerateButton - Button component for triggering AI generation
 * Shows AI icon and handles disabled state when limit is reached
 */
export function AIGenerateButton({ onClick, disabled, queryCount }: AIGenerateButtonProps) {
  const MAX_QUERIES = 5;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="outline"
            onClick={onClick}
            disabled={disabled}
            className="gap-2 mb-2"
            aria-label="Generuj opis i technologie za pomocą AI"
            aria-expanded={false}
          >
            <Sparkles className="size-4" />
            Generuj z AI
          </Button>
        </TooltipTrigger>
        {disabled && queryCount >= MAX_QUERIES && (
          <TooltipContent>
            <p>Osiągnięto limit {MAX_QUERIES} zapytań na projekt</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
