import React from "react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface AILimitInfoProps {
  queryCount: number;
  maxQueries?: number;
}

const DEFAULT_MAX_QUERIES = 5;

/**
 * AILimitInfo - Component displaying AI query limit information
 * Shows current usage and warnings when approaching limit
 */
export function AILimitInfo({ queryCount, maxQueries = DEFAULT_MAX_QUERIES }: AILimitInfoProps) {
  const remaining = maxQueries - queryCount;
  const isNearLimit = remaining <= 2 && remaining > 0;
  const isAtLimit = remaining === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}>
          Użyte zapytania: {queryCount}/{maxQueries}
        </Badge>
        {remaining > 0 && <span className="text-xs text-muted-foreground">({remaining} pozostało)</span>}
      </div>

      {isNearLimit && (
        <Alert>
          <Info className="size-4" />
          <AlertDescription className="text-sm">
            Zostało {remaining} {remaining === 1 ? "zapytanie" : "zapytań"}. Użyj ich rozważnie.
          </AlertDescription>
        </Alert>
      )}

      {isAtLimit && (
        <Alert variant="destructive">
          <Info className="size-4" />
          <AlertDescription>
            Osiągnięto limit {maxQueries} zapytań na projekt. Nie można już generować danych z AI.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
