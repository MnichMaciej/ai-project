export type { Database } from "./db/database.types";

// Project-related DTOs

// Represents the full project entity as returned in API responses (excludes user_id for security)
export type ProjectDto = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  | "id"
  | "name"
  | "description"
  | "technologies"
  | "status"
  | "repo_url"
  | "demo_url"
  | "preview_url"
  | "created_at"
  | "updated_at"
>;

// Command model for creating a new project (required fields from API plan, optional URLs)
export type CreateProjectDto = Pick<
  Database["public"]["Tables"]["projects"]["Insert"],
  "name" | "description" | "technologies" | "status"
> & {
  repo_url?: string | null;
  demo_url?: string | null;
  preview_url?: string | null;
};

// Command model for updating a project (partial update, allows any field from CreateProjectDto to be updated)
export type UpdateProjectDto = Partial<CreateProjectDto>;

// Response for listing projects
export interface ProjectsListResponse {
  projects: ProjectDto[];
  total: number;
}

// Command model for AI generation request (file links as per API plan)
export interface GenerateProjectAIRequest {
  file_links: string[]; // Array of raw GitHub URLs, max 8 as per plan
}

// Response for AI generation (populates project fields, includes query count)
export interface GenerateProjectAIResponse {
  description: string;
  technologies: string[];
  query_count: number;
}

// Note: User-related DTOs are not fully defined in the API plan endpoints, but for completeness:
// Basic user response (excludes sensitive fields)
export type UserDto = Pick<Database["public"]["Tables"]["users"]["Row"], "id" | "created_at" | "updated_at">;

// For auth responses, Supabase session types can be used directly, but custom locking fields may need extension if implemented
