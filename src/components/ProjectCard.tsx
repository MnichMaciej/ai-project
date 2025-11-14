import { useState, useRef, useEffect } from "react";
import { Edit, Trash2, ExternalLink, Github, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const [isImageValid, setIsImageValid] = useState<boolean | null>(null);
  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (descriptionRef.current) {
        // Get the actual CardDescription element (first child div)
        const descriptionElement = descriptionRef.current.querySelector(
          '[data-slot="card-description"]'
        ) as HTMLElement;
        if (descriptionElement) {
          // Check if text is truncated by comparing scrollHeight with clientHeight
          setIsDescriptionTruncated(descriptionElement.scrollHeight > descriptionElement.clientHeight);
        }
      }
    };

    checkTruncation();
    // Re-check on window resize
    window.addEventListener("resize", checkTruncation);
    return () => window.removeEventListener("resize", checkTruncation);
  }, [project.description]);

  // Reset image validation state when previewUrl changes
  useEffect(() => {
    if (project.previewUrl) {
      setIsImageValid(null);
    } else {
      setIsImageValid(false);
    }
  }, [project.previewUrl]);

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

  const handleImageLoad = () => {
    setIsImageValid(true);
  };

  const handleImageError = () => {
    setIsImageValid(false);
  };

  return (
    <>
      <Card className="flex flex-col h-full transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/50 duration-300 py-3 md:py-6 gap-3 md:gap-6">
        <CardHeader className="px-3 md:px-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Hidden image for validation - checks if image can be loaded */}
              {project.previewUrl && (
                <img
                  src={project.previewUrl}
                  alt=""
                  className="hidden"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  aria-hidden="true"
                />
              )}
              {/* Project icon - show when image loads successfully */}
              {project.previewUrl && isImageValid === true && (
                <img
                  src={project.previewUrl}
                  alt={`Ikona projektu ${project.name}`}
                  className="size-8 md:size-10 flex-shrink-0 rounded object-cover border border-border shadow-sm"
                  loading="lazy"
                />
              )}
              {/* Error indicator - show when previewUrl exists but image failed to load */}
              {project.previewUrl && isImageValid === false && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex-shrink-0" role="status" aria-label="Nie można wyświetlić ikony projektu">
                        <AlertCircle className="size-4 md:size-5 text-destructive" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Nie można wyświetlić ikony projektu</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <CardTitle className="text-lg md:text-xl drop-shadow-sm">{project.name}</CardTitle>
            </div>
            <Badge variant={getStatusVariant(project.status)}>{getStatusLabel(project.status)}</Badge>
          </div>
          <div className="group relative">
            {/* Description - always clamped on desktop, conditionally on mobile */}
            <div ref={descriptionRef}>
              <CardDescription
                className={`${!isDescriptionExpanded ? "line-clamp-2" : ""} md:line-clamp-2 text-xs md:text-sm`}
              >
                {project.description}
              </CardDescription>
            </div>

            {/* Desktop: hover overlay - only show if text is truncated */}
            {isDescriptionTruncated && (
              <div className="hidden md:block absolute -top-2 -left-2 -right-2 bg-card border border-border rounded-md p-2 text-xs md:text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <CardDescription className="m-0">{project.description}</CardDescription>
              </div>
            )}

            {/* Mobile: expand/collapse button */}
            <button
              onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
              className="md:hidden mt-1 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              aria-label={isDescriptionExpanded ? "Zwiń opis" : "Rozwiń opis"}
              aria-expanded={isDescriptionExpanded}
            >
              <span>{isDescriptionExpanded ? "Zwiń" : "Rozwiń"}</span>
              {isDescriptionExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
            </button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 px-3 md:px-6">
          {project.technologies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 md:gap-2">
              {project.technologies.map((tech, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tech}
                </Badge>
              ))}
            </div>
          )}

          {(project.repoUrl || project.demoUrl) && (
            <div className="flex gap-2 mt-3 md:mt-4">
              {project.repoUrl && (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={`Repozytorium projektu ${project.name}`}
                >
                  <Github className="size-3 md:size-4" />
                  <span>Repo</span>
                  <ExternalLink className="size-2.5 md:size-3" />
                </a>
              )}
              {project.demoUrl && (
                <a
                  href={project.demoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs md:text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  aria-label={`Demo projektu ${project.name}`}
                >
                  <ExternalLink className="size-3 md:size-4" />
                  <span>Demo</span>
                </a>
              )}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex gap-1.5 md:gap-2 px-3 md:px-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            aria-label={`Edytuj projekt ${project.name}`}
            className="flex-1 text-xs md:text-sm"
          >
            <Edit className="size-3 md:size-4" />
            Edytuj
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            aria-label={`Usuń projekt ${project.name}`}
            className="flex-1 text-xs md:text-sm"
          >
            <Trash2 className="size-3 md:size-4" />
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
