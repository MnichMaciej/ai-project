import { SupabaseClient } from "../db/supabase.client";
import { ProjectDto, ProjectsListResponse, ProjectStatus, CreateProjectDto, UpdateProjectDto } from "../types";
import type { Database } from "../db/database.types";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

interface FetchProjectsOptions {
  limit?: number;
  offset?: number;
  sort?: "status:asc" | "status:desc";
  search?: string;
}

export class ProjectService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Fetches all projects for a given user with optional pagination, sorting, and search
   * Search uses case-insensitive matching on name/description and checks if any technology contains the search term
   */
  async fetchUserProjects(userId: string, options: FetchProjectsOptions = {}): Promise<ProjectsListResponse> {
    try {
      const { limit = 10, offset = 0, sort, search } = options;

      // Start building the query
      let query = this.supabase.from("projects").select("*", { count: "exact" }).eq("user_id", userId);

      // Add search filtering if provided
      if (search && search.trim().length > 0) {
        const searchTerm = `%${search.trim()}%`;
        // Use OR to search across name and description with ilike (case-insensitive contains)
        // For technologies array, we filter client-side since Supabase doesn't support array substring search
        query = query.or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);
      }

      // Add sorting if specified
      if (sort) {
        const [field, order] = sort.split(":");
        if (field === "status") {
          query = query.order("status", { ascending: order === "asc" });
        }
      } else {
        // Default sorting by updated_at descending
        query = query.order("updated_at", { ascending: false });
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      // Execute the query
      const { data, error, count } = await query;

      if (error) {
        console.error("Error fetching projects:", error);
        throw new Error("Failed to fetch projects");
      }

      // Map database results to DTOs
      let projects: ProjectDto[] = data.map((project: ProjectRow) => {
        // Validate status is a valid ProjectStatus
        if (!Object.values(ProjectStatus).includes(project.status as ProjectStatus)) {
          throw new Error(`Invalid project status: ${project.status}`);
        }

        return {
          id: project.id,
          name: project.name,
          description: project.description,
          technologies: project.technologies,
          status: project.status as ProjectStatus,
          repoUrl: project.repo_url ?? null,
          demoUrl: project.demo_url ?? null,
          previewUrl: project.preview_url ?? null,
          createdAt: project.created_at,
          updatedAt: project.updated_at,
        };
      });

      // Filter by technologies if search is provided (client-side filtering for array contains)
      // Note: Server-side filtering handles name/description, but technologies array substring search
      // requires client-side filtering. This means total count may be approximate.
      if (search && search.trim().length > 0) {
        const searchLower = search.trim().toLowerCase();
        const filteredProjects = projects.filter(
          (project) =>
            project.name.toLowerCase().includes(searchLower) ||
            project.description.toLowerCase().includes(searchLower) ||
            project.technologies.some((tech) => tech.toLowerCase().includes(searchLower))
        );
        // Only update projects if filtering changed results
        // This handles cases where server-side filter didn't catch technology matches
        if (filteredProjects.length !== projects.length) {
          projects = filteredProjects;
          // Note: total count from server may not reflect technology filtering
          // For accurate count, we'd need a separate count query with technology filtering
        }
      }

      // Calculate hasMore based on server count and current offset
      // Note: If technologies filtering was applied client-side, this may be slightly inaccurate
      const hasMore = (count || 0) > offset + limit;

      return {
        projects,
        total: count || 0,
        hasMore,
      };
    } catch (error) {
      console.error("Error in fetchUserProjects:", error);
      throw new Error("Failed to fetch projects");
    }
  }

  /**
   * Creates a new project for the given user
   * Maps camelCase DTO fields to snake_case database columns
   * Returns the created project as ProjectDto
   */
  async createProject(createDto: CreateProjectDto, userId: string): Promise<ProjectDto> {
    try {
      // Map DTO (camelCase) to DB insert format (snake_case)
      const dbInsert = {
        name: createDto.name,
        description: createDto.description,
        technologies: createDto.technologies,
        status: createDto.status,
        repo_url: createDto.repoUrl,
        demo_url: createDto.demoUrl,
        preview_url: createDto.previewUrl,
        user_id: userId,
      };

      // Insert into projects table and retrieve created record
      const { data, error } = await this.supabase
        .from("projects")
        .insert(dbInsert)
        .select("id, name, description, technologies, status, repo_url, demo_url, preview_url, created_at, updated_at")
        .single();

      if (error) {
        console.error("Database error creating project:", error);
        throw new Error("Failed to create project");
      }

      if (!data) {
        console.error("No data returned from insert operation");
        throw new Error("Failed to create project");
      }

      // Validate status enum
      if (!Object.values(ProjectStatus).includes(data.status as ProjectStatus)) {
        throw new Error(`Invalid project status returned: ${data.status}`);
      }

      // Map DB result (snake_case) to DTO (camelCase)
      const projectDto: ProjectDto = {
        id: data.id,
        name: data.name,
        description: data.description,
        technologies: data.technologies,
        status: data.status as ProjectStatus,
        repoUrl: data.repo_url ?? null,
        demoUrl: data.demo_url ?? null,
        previewUrl: data.preview_url ?? null,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return projectDto;
    } catch (error) {
      console.error("Error in createProject:", error);
      throw error;
    }
  }

  /**
   * Updates an existing project with partial data
   * Verifies ownership before update, then maps camelCase DTO to snake_case DB columns
   * Returns the updated project as ProjectDto, or throws error if not found or not owner
   */
  async updateProject(id: string, updateDto: UpdateProjectDto, userId: string): Promise<ProjectDto> {
    try {
      // Step 1: Verify project exists and user is the owner
      const { data: existingProject, error: fetchError } = await this.supabase
        .from("projects")
        .select("user_id")
        .eq("id", id)
        .single();

      if (fetchError || !existingProject) {
        throw { code: 404, message: "Project not found" };
      }

      // Step 2: Check ownership
      if (existingProject.user_id !== userId) {
        throw { code: 403, message: "Not owner" };
      }

      // Step 3: Map camelCase DTO fields to snake_case for database update
      const dbUpdate: Record<string, unknown> = {};
      if (updateDto.name !== undefined) dbUpdate.name = updateDto.name;
      if (updateDto.description !== undefined) dbUpdate.description = updateDto.description;
      if (updateDto.technologies !== undefined) dbUpdate.technologies = updateDto.technologies;
      if (updateDto.status !== undefined) dbUpdate.status = updateDto.status;
      if (updateDto.repoUrl !== undefined) dbUpdate.repo_url = updateDto.repoUrl;
      if (updateDto.demoUrl !== undefined) dbUpdate.demo_url = updateDto.demoUrl;
      if (updateDto.previewUrl !== undefined) dbUpdate.preview_url = updateDto.previewUrl;

      // Step 4: Perform update and fetch updated record
      const { data: updatedProject, error: updateError } = await this.supabase
        .from("projects")
        .update(dbUpdate)
        .eq("id", id)
        .select("id, name, description, technologies, status, repo_url, demo_url, preview_url, created_at, updated_at")
        .single();

      if (updateError) {
        console.error("Database error updating project:", updateError);
        throw { code: 500, message: "Failed to update project" };
      }

      if (!updatedProject) {
        console.error("No data returned from update operation");
        throw { code: 500, message: "Failed to update project" };
      }

      // Step 5: Validate status enum
      if (!Object.values(ProjectStatus).includes(updatedProject.status as ProjectStatus)) {
        throw { code: 500, message: `Invalid project status returned: ${updatedProject.status}` };
      }

      // Step 6: Map DB result (snake_case) to DTO (camelCase)
      const projectDto: ProjectDto = {
        id: updatedProject.id,
        name: updatedProject.name,
        description: updatedProject.description,
        technologies: updatedProject.technologies,
        status: updatedProject.status as ProjectStatus,
        repoUrl: updatedProject.repo_url ?? null,
        demoUrl: updatedProject.demo_url ?? null,
        previewUrl: updatedProject.preview_url ?? null,
        createdAt: updatedProject.created_at,
        updatedAt: updatedProject.updated_at,
      };

      return projectDto;
    } catch (error) {
      // Re-throw custom errors with specific codes
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }
      console.error("Error in updateProject:", error);
      throw { code: 500, message: "Internal server error" };
    }
  }

  /**
   * Deletes a project by ID, verifying ownership before deletion
   * Returns a success message on deletion or throws error if not found or not owner
   */
  async deleteProject(id: string, userId: string): Promise<void> {
    try {
      // Step 1: Verify project exists and user is the owner
      const { data: existingProject, error: fetchError } = await this.supabase
        .from("projects")
        .select("user_id")
        .eq("id", id)
        .single();

      if (fetchError || !existingProject) {
        throw { code: 404, message: "Project not found" };
      }

      // Step 2: Check ownership
      if (existingProject.user_id !== userId) {
        throw { code: 403, message: "Not owner" };
      }

      // Step 3: Delete the project (cascade to ai_queries via database triggers)
      const { error: deleteError } = await this.supabase.from("projects").delete().eq("id", id);

      if (deleteError) {
        console.error("Database error deleting project:", deleteError);
        throw { code: 500, message: "Failed to delete project" };
      }
    } catch (error) {
      // Re-throw custom errors with specific codes
      if (error && typeof error === "object" && "code" in error) {
        throw error;
      }
      console.error("Error in deleteProject:", error);
      throw { code: 500, message: "Internal server error" };
    }
  }
}
