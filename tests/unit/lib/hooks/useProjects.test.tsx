import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProjects } from '@/lib/hooks/useProjects';
import { ProjectStatus } from '@/types';

// Mock window.location
const mockLocation = {
  href: '',
  origin: 'http://localhost:3000',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

describe('useProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useProjects_should_fetch_projects_with_pagination', () => {
    it('should fetch projects on mount', async () => {
      // Arrange
      const mockProjects = {
        projects: [
          {
            id: '1',
            name: 'Project 1',
            description: 'Description 1',
            technologies: ['React'],
            status: ProjectStatus.PLANNING,
            repoUrl: null,
            demoUrl: null,
            previewUrl: null,
            createdAt: '2024-01-01',
            updatedAt: '2024-01-01',
          },
        ],
        total: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProjects,
      });

      // Act
      const { result } = renderHook(() => useProjects());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.projects).toHaveLength(1);
        expect(result.current.total).toBe(1);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects'),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      // Check that the URL contains the expected parameters (accounting for URL encoding)
      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('limit=50');
      expect(fetchCall).toContain('offset=0');
      expect(fetchCall).toMatch(/sort=status(?:%3A|:)/);
    });

    it('should handle empty projects list', async () => {
      // Arrange
      const mockProjects = {
        projects: [],
        total: 0,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProjects,
      });

      // Act
      const { result } = renderHook(() => useProjects());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.projects).toHaveLength(0);
        expect(result.current.total).toBe(0);
      });
    });
  });

  describe('useProjects_should_handle_loading_and_error_states', () => {
    it('should set loading state initially', () => {
      // Arrange
      global.fetch = vi.fn().mockImplementation(
        () =>
          new Promise(() => {
            // Never resolve to keep loading state
          })
      );

      // Act
      const { result } = renderHook(() => useProjects());

      // Assert
      expect(result.current.loading).toBe(true);
      expect(result.current.projects).toEqual([]);
    });

    it('should handle API errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      });

      // Act
      const { result } = renderHook(() => useProjects());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Błąd serwera, spróbuj ponownie');
      });
    });

    it('should redirect to login on 401 error', async () => {
      // Arrange
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      // Act
      renderHook(() => useProjects());

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe('/login');
      });
    });

    it('should handle network errors', async () => {
      // Arrange
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      // Act
      const { result } = renderHook(() => useProjects());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Network error');
      });
    });

    it('should refetch projects on demand', async () => {
      // Arrange
      const mockProjects = {
        projects: [],
        total: 0,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockProjects,
      });

      // Act
      const { result } = renderHook(() => useProjects());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      vi.clearAllMocks();

      // Refetch
      await result.current.refetch();

      // Assert
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});

