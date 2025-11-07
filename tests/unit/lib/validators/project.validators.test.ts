import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  updateProjectSchema,
  generateProjectAISchema,
  projectsQuerySchema,
} from '@/lib/validators/project.validators';
import { ProjectStatus } from '@/types';

describe('projectValidators', () => {
  describe('projectValidators_should_validate_create_project_schema', () => {
    it('should validate valid project data', () => {
      // Arrange
      const validData = {
        name: 'My Project',
        description: 'Project description',
        technologies: ['React', 'TypeScript'],
        status: ProjectStatus.PLANNING,
        repoUrl: 'https://github.com/user/repo',
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('My Project');
        expect(result.data.technologies).toEqual(['React', 'TypeScript']);
      }
    });

    it('should reject empty name', () => {
      // Arrange
      const invalidData = {
        name: '',
        description: 'Description',
        technologies: ['React'],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject name exceeding 255 characters', () => {
      // Arrange
      const invalidData = {
        name: 'x'.repeat(256),
        description: 'Description',
        technologies: ['React'],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject empty technologies array', () => {
      // Arrange
      const invalidData = {
        name: 'Project',
        description: 'Description',
        technologies: [],
        status: ProjectStatus.PLANNING,
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject invalid status enum', () => {
      // Arrange
      const invalidData = {
        name: 'Project',
        description: 'Description',
        technologies: ['React'],
        status: 'INVALID_STATUS',
        repoUrl: null,
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL format', () => {
      // Arrange
      const invalidData = {
        name: 'Project',
        description: 'Description',
        technologies: ['React'],
        status: ProjectStatus.PLANNING,
        repoUrl: 'not-a-url',
        demoUrl: null,
        previewUrl: null,
      };

      // Act
      const result = createProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe('projectValidators_should_validate_ai_generation_request', () => {
    it('should validate valid file links', () => {
      // Arrange
      const validData = {
        fileLinks: [
          'https://raw.githubusercontent.com/user/repo/main/file1.ts',
          'https://raw.githubusercontent.com/user/repo/main/file2.ts',
        ],
      };

      // Act
      const result = generateProjectAISchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject empty file links array', () => {
      // Arrange
      const invalidData = {
        fileLinks: [],
      };

      // Act
      const result = generateProjectAISchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject more than 8 file links', () => {
      // Arrange
      const invalidData = {
        fileLinks: Array(9).fill('https://raw.githubusercontent.com/user/repo/main/file.ts'),
      };

      // Act
      const result = generateProjectAISchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL format', () => {
      // Arrange
      const invalidData = {
        fileLinks: ['not-a-url'],
      };

      // Act
      const result = generateProjectAISchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should accept exactly 8 file links', () => {
      // Arrange
      const validData = {
        fileLinks: Array(8).fill('https://raw.githubusercontent.com/user/repo/main/file.ts'),
      };

      // Act
      const result = generateProjectAISchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('projectValidators_should_validate_update_project_partial_data', () => {
    it('should validate partial update with at least one field', () => {
      // Arrange
      const validData = {
        name: 'Updated Name',
      };

      // Act
      const result = updateProjectSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should reject empty update object', () => {
      // Arrange
      const invalidData = {};

      // Act
      const result = updateProjectSchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should validate multiple fields in partial update', () => {
      // Arrange
      const validData = {
        name: 'Updated Name',
        description: 'Updated Description',
        status: ProjectStatus.IN_PROGRESS,
      };

      // Act
      const result = updateProjectSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });

    it('should validate all fields optional in update', () => {
      // Arrange
      const validData = {
        technologies: ['React', 'Vue'],
      };

      // Act
      const result = updateProjectSchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe('projectsQuerySchema validation', () => {
    it('should validate query parameters with defaults', () => {
      // Arrange
      const validData = {};

      // Act
      const result = projectsQuerySchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should validate custom limit and offset', () => {
      // Arrange
      const validData = {
        limit: 10,
        offset: 20,
        sort: 'status:asc' as const,
      };

      // Act
      const result = projectsQuerySchema.safeParse(validData);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(10);
        expect(result.data.offset).toBe(20);
        expect(result.data.sort).toBe('status:asc');
      }
    });

    it('should reject limit exceeding maximum', () => {
      // Arrange
      const invalidData = {
        limit: 101,
      };

      // Act
      const result = projectsQuerySchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });

    it('should reject negative offset', () => {
      // Arrange
      const invalidData = {
        offset: -1,
      };

      // Act
      const result = projectsQuerySchema.safeParse(invalidData);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

