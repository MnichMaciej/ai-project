import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddProject: () => void;
}

/**
 * EmptyState component displayed when user has no projects yet
 * Shows a friendly message and CTA button to add first project
 */
export function EmptyState({ onAddProject }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      <div className="rounded-full bg-primary/10 p-6 mb-4 animate-pulse">
        <PlusCircle className="size-12 text-primary drop-shadow-lg" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-semibold mb-2 drop-shadow-sm">Nie masz jeszcze żadnych projektów</h2>

      <p className="text-foreground/80 mb-6 max-w-md font-medium drop-shadow-sm">
        Dodaj swój pierwszy projekt, aby rozpocząć budowanie swojego portfolio
      </p>

      <Button onClick={onAddProject} size="lg" aria-label="Dodaj nowy projekt" className="shadow-lg hover:shadow-xl hover:scale-105 transition-all">
        <PlusCircle className="mr-2" />
        Dodaj projekt
      </Button>
    </div>
  );
}
