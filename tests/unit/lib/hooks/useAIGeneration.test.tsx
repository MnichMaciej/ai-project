import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAIGeneration } from '@/lib/hooks/useAIGeneration';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock window.location
const mockLocation = {
  href: '',
};
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

// Mock fetch
global.fetch = vi.fn();

// Mock useForm to return a mock form object with actual state tracking
const createMockForm = () => {
  const formState = {
    name: '',
    description: '',
    technologies: [] as string[],
    status: 'PLANNING' as const,
    repoUrl: null as string | null,
    demoUrl: null as string | null,
    previewUrl: null as string | null,
  };

  const setValueFn = vi.fn((field: string, value: unknown) => {
    (formState as Record<string, unknown>)[field] = value;
  });

  const getValuesFn = vi.fn((field?: string) => {
    if (field) {
      return (formState as Record<string, unknown>)[field];
    }
    return { ...formState };
  });

  return {
    setValue: setValueFn,
    getValues: getValuesFn,
    formState: {
      errors: {},
      touchedFields: {},
    },
    trigger: vi.fn(),
    setError: vi.fn(),
  };
};

describe('useAIGeneration', () => {
  let mockForm: ReturnType<typeof createMockForm>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.href = '';

    // Create a mock form
    mockForm = createMockForm();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useAIGeneration_should_validate_github_raw_urls', () => {
    it('should validate correct GitHub raw URLs', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      const validLinks = [
        'https://raw.githubusercontent.com/user/repo/main/file.ts',
        'https://raw.githubusercontent.com/user/repo/branch/path/to/file.js',
      ];

      // Act
      const validation = result.current.validateLinks(validLinks.join('\n'));

      // Assert
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should reject invalid URL format', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      const invalidLinks = ['https://github.com/user/repo/blob/main/file.ts'];

      // Act
      const validation = result.current.validateLinks(invalidLinks.join('\n'));

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('should reject more than 8 files', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      const tooManyLinks = Array(9)
        .fill('https://raw.githubusercontent.com/user/repo/main/file.ts')
        .join('\n');

      // Act
      const validation = result.current.validateLinks(tooManyLinks);

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('Maksymalnie 8'))).toBe(true);
    });

    it('should reject empty input', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      // Act
      const validation = result.current.validateLinks('');

      // Assert
      expect(validation.valid).toBe(false);
      expect(validation.errors.some((e) => e.includes('co najmniej jeden link'))).toBe(true);
    });
  });

  describe('useAIGeneration_should_enforce_query_limits', () => {
    it('should disable button when query limit reached', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          initialQueryCount: 5,
          form: mockForm,
        })
      );

      // Assert
      expect(result.current.isButtonDisabled).toBe(true);
    });

    it('should disable button when no projectId', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: null,
          form: mockForm,
        })
      );

      // Assert
      expect(result.current.isButtonDisabled).toBe(true);
    });

    it('should prevent opening input when limit reached', () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          initialQueryCount: 5,
          form: mockForm,
        })
      );

      // Act
      result.current.openInput();

      // Assert
      expect(toast.error).toHaveBeenCalledWith('Osiągnięto limit 5 zapytań na projekt');
      expect(result.current.state.isOpen).toBe(false);
    });
  });

  describe('useAIGeneration_should_handle_ai_generation_request', () => {
    it('should generate AI data successfully', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      const mockResponse = {
        description: 'AI generated description',
        technologies: ['React', 'TypeScript'],
        queryCount: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];

      // Act
      await result.current.generateAI(fileLinks);

      // Assert
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/project-123/ai-generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ fileLinks }),
          signal: expect.any(AbortSignal),
        });
        expect(mockForm.getValues('description')).toBe('AI generated description');
        expect(mockForm.getValues('technologies')).toEqual(['React', 'TypeScript']);
        expect(toast.success).toHaveBeenCalled();
      });
    });

    it('should handle 429 rate limit error', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: 'Rate limit exceeded' }),
      });

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];

      // Act
      await result.current.generateAI(fileLinks);

      // Assert
      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Osiągnięto limit 5 zapytań na projekt');
        expect(result.current.state.status).toBe('error');
      });
    });

    it('should handle 401 unauthorized error', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];

      // Act
      await result.current.generateAI(fileLinks);

      // Assert
      await waitFor(() => {
        expect(mockLocation.href).toBe('/login');
      });
    });
  });

  describe('useAIGeneration_should_manage_loading_states', () => {
    it('should set loading state during request', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      let resolveFetch: (value: Response) => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(fetchPromise);

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];

      // Act
      const generatePromise = result.current.generateAI(fileLinks);

      // Assert
      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(true);
        expect(result.current.state.status).toBe('loading');
      });

      // Resolve fetch
      resolveFetch!({
        ok: true,
        json: async () => ({
          description: 'Test',
          technologies: ['React'],
          queryCount: 1,
        }),
      } as Response);

      await generatePromise;

      await waitFor(() => {
        expect(result.current.state.isLoading).toBe(false);
      });
    });

    it('should cancel request on close', async () => {
      // Arrange
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
        })
      );

      const abortController = new AbortController();
      const abortSpy = vi.spyOn(abortController, 'abort');

      global.fetch = vi.fn().mockImplementation(() => {
        return new Promise(() => {
          // Never resolve to simulate ongoing request
        });
      });

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];
      result.current.generateAI(fileLinks);

      // Act
      result.current.closeInput();

      // Assert
      await waitFor(() => {
        expect(result.current.state.isOpen).toBe(false);
      });
    });
  });

  describe('useAIGeneration_should_update_form_with_ai_data', () => {
    it('should update form fields with AI data', async () => {
      // Arrange
      const onUpdateProject = vi.fn();
      const { result } = renderHook(() =>
        useAIGeneration({
          projectId: 'project-123',
          form: mockForm,
          onUpdateProject,
        })
      );

      const mockResponse = {
        description: 'Updated description',
        technologies: ['Vue', 'Nuxt'],
        queryCount: 1,
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const fileLinks = ['https://raw.githubusercontent.com/user/repo/main/file.ts'];

      // Act
      await result.current.generateAI(fileLinks);

      // Assert
      await waitFor(() => {
        expect(mockForm.getValues('description')).toBe('Updated description');
        expect(mockForm.getValues('technologies')).toEqual(['Vue', 'Nuxt']);
        expect(onUpdateProject).toHaveBeenCalledWith({
          description: 'Updated description',
          technologies: ['Vue', 'Nuxt'],
        });
      });
    });
  });
});

