import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectDto } from "@/types";

interface ProjectsListProps {
  projects: ProjectDto[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  lastItemRef?: React.RefObject<HTMLDivElement | null>;
}

/**
 * ProjectsList component - displays projects in a responsive grid
 * Grid adapts from 1 column on mobile to 3 columns on desktop
 * Supports ref on last item for infinite scroll detection
 */
export function ProjectsList({ projects, onEdit, onDelete, lastItemRef }: ProjectsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
      {projects.map((project, index) => {
        const isLast = index === projects.length - 1;
        return (
          <div key={project.id} ref={isLast ? lastItemRef : undefined}>
            <ProjectCard project={project} onEdit={onEdit} onDelete={onDelete} />
          </div>
        );
      })}
    </div>
  );
}
