import { z } from "zod";
import { ProjectStatus } from "../../types";

export const projectsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  offset: z.coerce.number().int().min(0).optional().default(0),
  sort: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      return String(val);
    },
    z.enum(["status:asc", "status:desc"]).optional()
  ),
  search: z.preprocess(
    (val) => {
      if (val === null || val === undefined || val === "") {
        return undefined;
      }
      const str = String(val).trim();
      return str === "" ? undefined : str;
    },
    z.string().optional()
  ),
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

// Schema for deleting a project - validates that ID is a valid UUID
export const deleteProjectSchema = z.object({
  id: z.string().uuid("Invalid project ID format"),
});

export type DeleteProjectInput = z.infer<typeof deleteProjectSchema>;

// Schema for AI generation request - validates fileLinks array and GitHub URLs
export const generateProjectAISchema = z.object({
  fileLinks: z
    .array(z.string().url("Each item must be a valid URL"))
    .min(1, "At least one file link is required")
    .max(8, "Maximum 8 file links allowed"),
  modelFallback: z.boolean().optional().default(true), // Optional flag to enable fallback mechanism
});

export type GenerateProjectAIInput = z.infer<typeof generateProjectAISchema>;
