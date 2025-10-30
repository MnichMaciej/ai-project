import { useState } from "react";
import { Edit, Trash2, ExternalLink, Github } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ProjectDto, ProjectStatus } from "@/types";

interface ProjectCardProps {
  project: ProjectDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// Helper function to get status label in Polish
function getStatusLabel(status: ProjectStatus): string {
  const statusLabels: Record<ProjectStatus, string> = {
    PLANNING: "Planowanie",
    IN_PROGRESS: "W trakcie",
    MVP_COMPLETED: "MVP ukończone",
    FINISHED: "Ukończony",
  };
  return statusLabels[status];
}

// Helper function to get status badge variant
function getStatusVariant(status: ProjectStatus): "default" | "secondary" | "destructive" | "outline" {
  const variantMap: Record<ProjectStatus, "default" | "secondary" | "destructive" | "outline"> = {
    PLANNING: "outline",
    IN_PROGRESS: "default",
    MVP_COMPLETED: "secondary",
    FINISHED: "default",
  };
  return variantMap[status];
}

/**
 * ProjectCard component - displays a single project as a card
 * Shows project name, description, technologies, status, and action buttons
 */
export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    onDelete(project.id);
    setShowDeleteDialog(false);
  };

  const handleEditClick = () => {
    onEdit(project.id);
  };

  return (
    <>
      <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 duration-300">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-xl">{project.name}</CardTitle>
            <Badge variant={getStatusVariant(project.status)}>{getStatusLabel(project.status)}</Badge>
          </div>
          <CardDescription className="line-clamp-2">{project.description}</CardDescription>
        </CardHeader>

        <CardContent className="flex-1">
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary">
                  {tech}
                </Badge>
              ))}
            </div>
          )}

          {(project.repoUrl || project.demoUrl) && (
            <div className="flex gap-2 mt-4">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Repozytorium projektu ${project.name}`}
                >
                  <Github className="size-4" />
                  <span>Repo</span>
                  <ExternalLink className="size-3" />
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={`Demo projektu ${project.name}`}
                >
                  <ExternalLink className="size-4" />
                  <span>Demo</span>
                </a>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            aria-label={`Edytuj projekt ${project.name}`}
            className="flex-1"
          >
            <Edit />
            Edytuj
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            aria-label={`Usuń projekt ${project.name}`}
            className="flex-1"
          >
            <Trash2 />
            Usuń
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć ten projekt?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta akcja jest nieodwracalna. Projekt &quot;{project.name}&quot; zostanie trwale usunięty.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Usuń projekt</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
