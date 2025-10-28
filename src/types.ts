// Project-related DTOs

// Enum used for project status
export enum ProjectStatus {
  PLANNING = "PLANNING",
  IN_PROGRESS = "IN_PROGRESS",
  MVP_COMPLETED = "MVP_COMPLETED",
  FINISHED = "FINISHED",
}

// Represents the full project entity as returned in API responses (excludes userId for security)
export interface ProjectDto {
  id: string;
  name: string;
  description: string;
  technologies: string[];
  status: ProjectStatus;
  repoUrl: string | null;
  demoUrl: string | null;
  previewUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// Command model for creating a new project (required fields from API plan, optional URLs)
export interface CreateProjectDto {
  name: string;
  description: string;
  technologies: string[];
  status: ProjectStatus;
  repoUrl: string | null;
  demoUrl: string | null;
  previewUrl: string | null;
}

// Command model for updating a project (partial update, allows any field from CreateProjectDto to be updated)
export type UpdateProjectDto = Partial<CreateProjectDto>;

// Response for listing projects
export interface ProjectsListResponse {
  projects: ProjectDto[];
  total: number;
}

// Command model for AI generation request (file links as per API plan)
export interface GenerateProjectAIRequest {
  fileLinks: string[]; // Array of raw GitHub URLs, max 8 as per plan
}

// Response for AI generation (populates project fields, includes query count)
export interface GenerateProjectAIResponse {
  description: string;
  technologies: string[];
  queryCount: number;
}

// Response for successful project deletion
export interface DeleteProjectResponse {
  message: string;
}

// Note: User-related DTOs are not fully defined in the API plan endpoints, but for completeness:
// Basic user response (excludes sensitive fields)
export interface UserDto {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// For auth responses, Supabase session types can be used directly, but custom locking fields may need extension if implemented
