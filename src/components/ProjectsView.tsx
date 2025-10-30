import { useState } from "react";
import { toast } from "sonner";
import { useProjects } from "@/lib/hooks/useProjects";
import { ProjectsList } from "@/components/ProjectsList";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

/**
 * ProjectsView - Main container for the projects view
 * Manages state, data fetching, and conditional rendering based on state
 */
export function ProjectsView() {
  const { projects, loading, error, total, refetch } = useProjects();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleAddProject = () => {
    // Navigate to create project page
    window.location.href = "/projects/new";
  };

  const handleEdit = (id: string) => {
    // Navigate to edit project page
    window.location.href = `/projects/${id}/edit`;
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return; // Prevent multiple delete operations

    setDeletingId(id);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = "/login";
          return;
        }
        throw new Error("Nie udało się usunąć projektu");
      }

      // Show success toast
      toast.success("Projekt został pomyślnie usunięty");

      // Refetch projects after successful deletion
      await refetch();
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Nie udało się usunąć projektu. Spróbuj ponownie.");
    } finally {
      setDeletingId(null);
    }
  };

  // Loading state
  if (loading && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="mb-6">
          <div className="h-9 w-48 bg-muted animate-pulse rounded-md mb-2" />
          <div className="h-5 w-32 bg-muted animate-pulse rounded-md" />
        </div>
        <SkeletonGrid count={6} />
      </div>
    );
  }

  // Error state
  if (error && projects.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col items-center justify-center text-center py-12">
          <AlertCircle className="size-12 text-destructive mb-4 animate-in zoom-in duration-300" aria-hidden="true" />
          <h2 className="text-2xl font-semibold mb-2">Wystąpił błąd</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={refetch}>Spróbuj ponownie</Button>
        </div>
      </div>
    );
  }

  // Empty state
  if (projects.length === 0 && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <EmptyState onAddProject={handleAddProject} />
      </div>
    );
  }

  // Projects list
  return (
    <div className="container mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Moje projekty</h1>
          <p className="text-muted-foreground mt-1">
            {total} {total === 1 ? "projekt" : total < 5 && total > 1 ? "projekty" : "projektów"}
          </p>
        </div>
        <Button onClick={handleAddProject}>Dodaj projekt</Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
          <AlertCircle className="size-5" />
          <span>{error}</span>
        </div>
      )}

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <ProjectsList projects={projects} onEdit={handleEdit} onDelete={handleDelete} />
      </div>
    </div>
  );
}
