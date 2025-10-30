import { ProjectCard } from "@/components/ProjectCard";
import type { ProjectDto } from "@/types";

interface ProjectsListProps {
  projects: ProjectDto[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * ProjectsList component - displays projects in a responsive grid
 * Grid adapts from 1 column on mobile to 3 columns on desktop
 */
export function ProjectsList({ projects, onEdit, onDelete }: ProjectsListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
