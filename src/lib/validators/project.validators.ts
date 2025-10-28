import { z } from "zod";
import { ProjectStatus } from "../../types";

export const projectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.enum(["status:asc", "status:desc"]).optional(),
});

export type ProjectsQueryParams = z.infer<typeof projectsQuerySchema>;

// Schema for creating a new project - validates CreateProjectDto
export const createProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)).min(1),
  status: z.nativeEnum(ProjectStatus),
  repoUrl: z.string().url().nullable().default(null),
  demoUrl: z.string().url().nullable().default(null),
  previewUrl: z.string().url().nullable().default(null),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Schema for updating a project - validates UpdateProjectDto (all fields optional, but at least one required)
export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "At least one field must be provided for update",
  });

export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
