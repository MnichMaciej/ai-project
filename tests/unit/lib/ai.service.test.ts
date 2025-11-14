import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService, OpenRouterError, ValidationError } from "@/lib/openrouter.service";

// Mock OpenRouterService
const mockOpenRouterInstance = {
  generateResponse: vi.fn(),
};

vi.mock("@/lib/openrouter.service", () => {
  const OpenRouterError = class OpenRouterError extends Error {
    constructor(
      message: string,
      public readonly statusCode?: number
    ) {
      super(message);
      this.name = "OpenRouterError";
    }
  };

  const ValidationError = class ValidationError extends Error {
    constructor(
      message: string,
      public readonly details?: unknown
    ) {
      super(message);
      this.name = "ValidationError";
    }
  };

  // Create a mock class that can be instantiated with 'new'
  class MockOpenRouterService {
    generateResponse = mockOpenRouterInstance.generateResponse;
  }

  return {
    OpenRouterService: MockOpenRouterService,
    OpenRouterError,
    ValidationError,
  };
});

// Mock import.meta.env before importing AIService
vi.stubEnv("OPENROUTER_API_KEY", "test-api-key");

import { AIService } from "@/lib/ai.service";

describe("AIService", () => {
  let aiService: AIService;

  beforeEach(() => {
    // Suppress console.error output during tests (expected errors are being tested)
    vi.spyOn(console, "error").mockImplementation(() => {});
    
    // Reset mocks but keep the instance
    mockOpenRouterInstance.generateResponse.mockClear();
    vi.clearAllMocks();

    aiService = new AIService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("AIService_should_generate_project_description_from_github_files", () => {
    it("should fetch files from GitHub and generate project description", async () => {
      // Arrange
      const fileLinks = [
        "https://raw.githubusercontent.com/user/repo/main/src/index.ts",
        "https://raw.githubusercontent.com/user/repo/main/package.json",
      ];
      const fileContents = ["const x = 1;", '{"name": "project"}'];
      const aiResponse = {
        content: JSON.stringify({
          description: "Test project description",
          technologies: ["TypeScript", "React"],
        }),
      };

      // Mock fetch for GitHub files
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes("raw.githubusercontent.com")) {
          const index = fileLinks.indexOf(url);
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve(fileContents[index]),
          } as Response);
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      // Mock OpenRouter response
      mockOpenRouterInstance.generateResponse.mockResolvedValue({
        content: aiResponse.content,
        structuredData: {
          description: "Test project description",
          technologies: ["TypeScript", "React"],
        },
      });

      // Act
      const files = await aiService.fetchFilesFromGitHub(fileLinks);
      const result = await aiService.callOpenrouterAI(files);
      const parsed = aiService.parseAIResponse(result);

      // Assert
      expect(files).toEqual(fileContents);
      expect(mockOpenRouterInstance.generateResponse).toHaveBeenCalled();
      expect(parsed.description).toBe("Test project description");
      expect(parsed.technologies).toEqual(["TypeScript", "React"]);
    });
  });

  describe("AIService_should_handle_github_fetch_errors", () => {
    it("should throw error for invalid GitHub URL", async () => {
      // Arrange
      const invalidLinks = ["https://github.com/user/repo/blob/main/file.ts"];

      // Act & Assert
      await expect(aiService.fetchFilesFromGitHub(invalidLinks)).rejects.toThrow("Invalid GitHub URL");
    });

    it("should throw error when GitHub fetch fails", async () => {
      // Arrange
      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      } as Response);

      // Act & Assert
      await expect(aiService.fetchFilesFromGitHub(fileLinks)).rejects.toThrow("Failed to fetch file");
    });

    it("should handle network errors", async () => {
      // Arrange
      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      // Act & Assert
      await expect(aiService.fetchFilesFromGitHub(fileLinks)).rejects.toThrow("Failed to fetch file");
    });
  });

  describe("AIService_should_validate_file_size_limits", () => {
    it("should reject files exceeding 100KB limit", async () => {
      // Arrange
      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/large-file.ts"];
      const largeContent = "x".repeat(101 * 1024); // 101KB

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(largeContent),
      } as Response);

      // Act & Assert
      await expect(aiService.fetchFilesFromGitHub(fileLinks)).rejects.toThrow("File exceeds 100KB limit");
    });

    it("should accept files within 100KB limit", async () => {
      // Arrange
      const fileLinks = ["https://raw.githubusercontent.com/user/repo/main/file.ts"];
      const validContent = "x".repeat(50 * 1024); // 50KB

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: () => Promise.resolve(validContent),
      } as Response);

      // Act
      const result = await aiService.fetchFilesFromGitHub(fileLinks);

      // Assert
      expect(result).toEqual([validContent]);
    });
  });

  describe("AIService_should_parse_ai_response_json", () => {
    it("should parse clean JSON response", () => {
      // Arrange
      const aiResponse = {
        content: JSON.stringify({
          description: "Test description",
          technologies: ["TypeScript"],
        }),
      };

      // Act
      const parsed = aiService.parseAIResponse(aiResponse);

      // Assert
      expect(parsed.description).toBe("Test description");
      expect(parsed.technologies).toEqual(["TypeScript"]);
    });

    it("should parse JSON wrapped in markdown code blocks", () => {
      // Arrange
      const aiResponse = {
        content: '```json\n{"description": "Test", "technologies": ["React"]}\n```',
      };

      // Act
      const parsed = aiService.parseAIResponse(aiResponse);

      // Assert
      expect(parsed.description).toBe("Test");
      expect(parsed.technologies).toEqual(["React"]);
    });

    it("should filter out empty technologies", () => {
      // Arrange
      const aiResponse = {
        content: JSON.stringify({
          description: "Test",
          technologies: ["TypeScript", "", "  ", "React"],
        }),
      };

      // Act
      const parsed = aiService.parseAIResponse(aiResponse);

      // Assert
      expect(parsed.technologies).toEqual(["TypeScript", "React"]);
    });

    it("should throw error for invalid JSON format", () => {
      // Arrange
      const aiResponse = {
        content: "invalid json",
      };

      // Act & Assert
      expect(() => aiService.parseAIResponse(aiResponse)).toThrow("Failed to parse AI response");
    });

    it("should throw error when required fields are missing", () => {
      // Arrange
      const aiResponse = {
        content: JSON.stringify({
          description: "Test",
          // technologies missing
        }),
      };

      // Act & Assert
      expect(() => aiService.parseAIResponse(aiResponse)).toThrow("Invalid AI response format");
    });
  });

  describe("callOpenrouterAI error handling", () => {
    it("should re-throw OpenRouterError", async () => {
      // Arrange
      const filesContent = ["const x = 1;"];
      const openRouterError = new OpenRouterError("API error", 500);

      mockOpenRouterInstance.generateResponse.mockRejectedValue(openRouterError);

      // Act & Assert
      await expect(aiService.callOpenrouterAI(filesContent)).rejects.toThrow(OpenRouterError);
    });

    it("should re-throw ValidationError", async () => {
      // Arrange
      const filesContent = ["const x = 1;"];
      const validationError = new ValidationError("Validation failed");

      mockOpenRouterInstance.generateResponse.mockRejectedValue(validationError);

      // Act & Assert
      await expect(aiService.callOpenrouterAI(filesContent)).rejects.toThrow(ValidationError);
    });

    it("should handle generic errors", async () => {
      // Arrange
      const filesContent = ["const x = 1;"];
      const genericError = new Error("Generic error");

      mockOpenRouterInstance.generateResponse.mockRejectedValue(genericError);

      // Act & Assert
      await expect(aiService.callOpenrouterAI(filesContent)).rejects.toThrow("Failed to generate AI response");
    });
  });
});
