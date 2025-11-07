import { describe, it, expect, vi, beforeEach } from "vitest";
import { ProjectService } from "@/lib/project.service";
import { ProjectStatus } from "@/types";
import type { SupabaseClient } from "@/db/supabase.client";

// Mock Supabase client
const createMockSupabaseClient = (): SupabaseClient => {
  const mockQuery = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(),
  };

  return {
    from: vi.fn().mockReturnValue(mockQuery),
  } as unknown as SupabaseClient;
};

describe("ProjectService", () => {
  let projectService: ProjectService;
  let mockSupabase: SupabaseClient;
  let mockQuery: any;

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
    mockQuery = (mockSupabase as any).from("projects");
    projectService = new ProjectService(mockSupabase);
  });

  describe("ProjectService_should_fetch_user_projects_with_pagination", () => {
    it("should fetch projects with default pagination", async () => {
      // Arrange
      const userId = "user-123";
      const mockProjects = [
        {
          id: "1",
          name: "Project 1",
          description: "Description 1",
          technologies: ["React"],
          status: ProjectStatus.PLANNING,
          repo_url: null,
          demo_url: null,
          preview_url: null,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
          user_id: userId,
        },
      ];

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: mockProjects,
            error: null,
            count: 1,
          }),
        }),
      });

      // Act
      const result = await projectService.fetchUserProjects(userId);

      // Assert
      expect(result.projects).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.projects[0].name).toBe("Project 1");
    });

    it("should fetch projects with custom pagination", async () => {
      // Arrange
      const userId = "user-123";
      const options = { limit: 10, offset: 5, sort: "status:asc" as const };

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
              count: 0,
            }),
          }),
        }),
      });

      // Act
      await projectService.fetchUserProjects(userId, options);

      // Assert
      expect(mockQuery.select).toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      // Arrange
      const userId = "user-123";

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          range: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
            count: null,
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.fetchUserProjects(userId)).rejects.toThrow("Failed to fetch projects");
    });
  });

  describe("ProjectService_should_create_project_with_validation", () => {
    it("should create project and map DTO correctly", async () => {
      // Arrange
      const userId = "user-123";
      const createDto = {
        name: "New Project",
        description: "Description",
        technologies: ["TypeScript"],
        status: ProjectStatus.IN_PROGRESS,
        repoUrl: "https://github.com/user/repo",
        demoUrl: null,
        previewUrl: null,
      };

      const mockCreatedProject = {
        id: "project-123",
        name: createDto.name,
        description: createDto.description,
        technologies: createDto.technologies,
        status: createDto.status,
        repo_url: createDto.repoUrl,
        demo_url: null,
        preview_url: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      (mockQuery.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCreatedProject,
            error: null,
          }),
        }),
      });

      // Act
      const result = await projectService.createProject(createDto, userId);

      // Assert
      expect(result.id).toBe("project-123");
      expect(result.repoUrl).toBe("https://github.com/user/repo");
      expect(result.status).toBe(ProjectStatus.IN_PROGRESS);
    });

    it("should throw error for invalid status", async () => {
      // Arrange
      const userId = "user-123";
      const createDto = {
        name: "Project",
        description: "Description",
        technologies: ["React"],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      const mockCreatedProject = {
        ...createDto,
        id: "project-123",
        status: "INVALID_STATUS" as ProjectStatus,
        repo_url: null,
        demo_url: null,
        preview_url: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      (mockQuery.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockCreatedProject,
            error: null,
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.createProject(createDto, userId)).rejects.toThrow("Invalid project status");
    });
  });

  describe("ProjectService_should_update_project_with_ownership_check", () => {
    it("should update project when user is owner", async () => {
      // Arrange
      const projectId = "project-123";
      const userId = "user-123";
      const updateDto = {
        name: "Updated Name",
        description: "Updated Description",
      };

      // Mock ownership check
      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user_id: userId },
            error: null,
          }),
        }),
      });

      // Mock update
      const mockUpdatedProject = {
        id: projectId,
        name: updateDto.name,
        description: updateDto.description,
        technologies: ["React"],
        status: ProjectStatus.PLANNING,
        repo_url: null,
        demo_url: null,
        preview_url: null,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      (mockQuery.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockUpdatedProject,
              error: null,
            }),
          }),
        }),
      });

      // Act
      const result = await projectService.updateProject(projectId, updateDto, userId);

      // Assert
      expect(result.name).toBe("Updated Name");
      expect(result.description).toBe("Updated Description");
    });

    it("should throw error when project not found", async () => {
      // Arrange
      const projectId = "non-existent";
      const userId = "user-123";
      const updateDto = { name: "Updated" };

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Not found" },
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.updateProject(projectId, updateDto, userId)).rejects.toEqual({
        code: 404,
        message: "Project not found",
      });
    });

    it("should throw error when user is not owner", async () => {
      // Arrange
      const projectId = "project-123";
      const userId = "user-123";
      const ownerId = "other-user";
      const updateDto = { name: "Updated" };

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user_id: ownerId },
            error: null,
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.updateProject(projectId, updateDto, userId)).rejects.toEqual({
        code: 403,
        message: "Not owner",
      });
    });
  });

  describe("ProjectService_should_delete_project_with_ownership_verification", () => {
    it("should delete project when user is owner", async () => {
      // Arrange
      const projectId = "project-123";
      const userId = "user-123";

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user_id: userId },
            error: null,
          }),
        }),
      });

      (mockQuery.delete as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      // Act & Assert
      await expect(projectService.deleteProject(projectId, userId)).resolves.not.toThrow();
    });

    it("should throw error when user is not owner", async () => {
      // Arrange
      const projectId = "project-123";
      const userId = "user-123";
      const ownerId = "other-user";

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user_id: ownerId },
            error: null,
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.deleteProject(projectId, userId)).rejects.toEqual({
        code: 403,
        message: "Not owner",
      });
    });
  });

  describe("ProjectService_should_handle_database_errors_gracefully", () => {
    it("should handle database errors in createProject", async () => {
      // Arrange
      const userId = "user-123";
      const createDto = {
        name: "Project",
        description: "Description",
        technologies: ["React"],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      (mockQuery.insert as ReturnType<typeof vi.fn>).mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: "Database error" },
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.createProject(createDto, userId)).rejects.toThrow("Failed to create project");
    });

    it("should handle database errors in updateProject", async () => {
      // Arrange
      const projectId = "project-123";
      const userId = "user-123";
      const updateDto = { name: "Updated" };

      (mockQuery.select as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { user_id: userId },
            error: null,
          }),
        }),
      });

      (mockQuery.update as ReturnType<typeof vi.fn>).mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: "Database error" },
            }),
          }),
        }),
      });

      // Act & Assert
      await expect(projectService.updateProject(projectId, updateDto, userId)).rejects.toEqual({
        code: 500,
        message: "Failed to update project",
      });
    });
  });
});
