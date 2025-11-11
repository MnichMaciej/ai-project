import { OpenRouterService, OpenRouterError, ValidationError, FallbackExhaustedError } from "./openrouter.service.ts";
import type { Message, ResponseFormat, JsonSchema } from "../types.ts";
import { getFallbackModelSequence } from "./fallback-config.ts";

/**
 * AIService - Handles AI-related operations for project generation
 * Integrates with OpenRouter API for AI-powered code analysis
 */
export class AIService {
  private readonly _openRouterService: OpenRouterService;

  constructor() {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OPENROUTER_API_KEY environment variable is not set");
    }
    this._openRouterService = new OpenRouterService(apiKey);
  }

  async fetchFilesFromGitHub(fileLinks: string[]): Promise<string[]> {
    const MAX_FILE_SIZE = 100 * 1024;

    try {
      const fileContents = await Promise.all(
        fileLinks.map(async (url) => {
          if (!url.includes("raw.githubusercontent.com")) {
            throw new Error(`Invalid GitHub URL: ${url}`);
          }

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${url} (${response.status})`);
          }

          const content = await response.text();
          const sizeInBytes = new TextEncoder().encode(content).length;

          if (sizeInBytes > MAX_FILE_SIZE) {
            throw new Error(`File exceeds 100KB limit: ${url}`);
          }

          return content;
        })
      );

      return fileContents;
    } catch (error) {
      console.error("Error fetching files from GitHub:", error);
      throw new Error(`Failed to fetch file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async callOpenrouterAI(filesContent: string[]): Promise<{ content: string }> {
    try {
      // Create JSON schema for structured response
      const responseSchema: JsonSchema = {
        type: "object",
        properties: {
          description: {
            type: "string",
          },
          technologies: {
            type: "array",
            items: {
              type: "string",
            },
          },
        },
        required: ["description", "technologies"],
        additionalProperties: false,
      };

      const responseFormat: ResponseFormat = {
        type: "json_schema",
        jsonSchema: {
          name: "project-analysis",
          strict: true,
          schema: responseSchema,
        },
      };

      // Build system message with instructions
      const systemMessage: Message = {
        role: "system",
        content:
          "Jesteś ekspertem w analizie kodu źródłowego. Analizujesz pliki kodu i generujesz opis projektu oraz listę użytych technologii. " +
          "Opis powinien być zwięzły (2-4 zdania) i zawierać główne informacje o projekcie. Opis powinien byc w języku polskim. Maksymalna długość opisu to 1000 znaków. Minimalna długość opisu to 200 znaków. " +
          "Technologie powinny być listą konkretnych nazw technologii (np. TypeScript, React, Node.js, Tailwind CSS). Maksymalna i pożądana ilość technologii to 10, a minimalna to 1." +
          "Odpowiedz TYLKO czystym JSON bez żadnych znaczników Markdown, code blocków (np. bez ```json), dodatkowych tekstów czy wyjaśnień. " +
          'Użyj dokładnie tego formatu: {"description": "...", "technologies": ["tech1", "tech2"]}. ' +
          "JSON musi być zgodny z podanym schematem i zawierać pola 'description' (string) oraz 'technologies' (array of strings).",
      };

      // Build user message with file contents
      const filesSummary = filesContent
        .map((content, index) => {
          const preview = content.split("\n").slice(0, 50).join("\n"); // First 50 lines
          return `--- Plik ${index + 1} ---\n${preview}${content.split("\n").length > 50 ? "\n[...]" : ""}`;
        })
        .join("\n\n");

      const userMessage: Message = {
        role: "user",
        content: `Przeanalizuj poniższe pliki kodu i wygeneruj opis projektu oraz listę technologii:\n\n${filesSummary}`,
      };

      // Call OpenRouter API
      const response = await this._openRouterService.generateResponse([systemMessage, userMessage], {
        parameters: {
          temperature: 0.7,
          maxTokens: 1000,
        },
        responseFormat,
      });

      // Extract structured data
      if (response.structuredData) {
        const structured = response.structuredData as { description: string; technologies: string[] };
        return {
          content: JSON.stringify({
            description: structured.description,
            technologies: structured.technologies,
          }),
        };
      }

      // Fallback to parsing content if structured data not available
      return {
        content: response.content,
      };
    } catch (error) {
      console.error("Error calling Openrouter AI:", error);
      // Re-throw OpenRouter errors and ValidationErrors as-is
      if (error instanceof OpenRouterError || error instanceof ValidationError) {
        throw error;
      }
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  parseAIResponse(aiResponse: { content: string }): {
    description: string;
    technologies: string[];
  } {
    try {
      // Import the cleaning function or copy the logic
      const cleanedContent = aiResponse.content.trim();
      const jsonBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```$/gm;
      let parsedContent = cleanedContent;
      const match = jsonBlockRegex.exec(cleanedContent);
      if (match) {
        parsedContent = match[1].trim();
      }
      parsedContent = parsedContent
        .replace(/^\s*[\r\n]+|[\s\S]*?[\r\n]+\s*$/g, "")
        .trim()
        .replace(/^\s*\/\/.*$/gm, "");

      const parsed = JSON.parse(parsedContent);

      if (!parsed.description || !Array.isArray(parsed.technologies)) {
        throw new Error("Invalid AI response format");
      }

      return {
        description: parsed.description.trim(),
        technologies: parsed.technologies.filter((tech: unknown) => typeof tech === "string" && tech.trim().length > 0),
      };
    } catch (error) {
      console.error("Error parsing AI response:", error);
      throw new Error(`Failed to parse AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Generates AI response with fallback mechanism
   * Tries models sequentially from the fallback sequence if a model fails
   * @param fileLinks Array of GitHub raw file URLs
   * @param projectId Project ID (for logging purposes)
   * @param enableFallback Whether to enable fallback mechanism (default: true)
   * @returns Parsed AI response with description and technologies
   * @throws FallbackExhaustedError if all models fail
   */
  async generateWithFallback(
    fileLinks: string[],
    projectId: string,
    enableFallback = true
  ): Promise<{ description: string; technologies: string[] }> {
    // Fetch files first (this is common for all models)
    const filesContent = await this.fetchFilesFromGitHub(fileLinks);

    // Build messages (common for all models)
    const responseSchema: JsonSchema = {
      type: "object",
      properties: {
        description: {
          type: "string",
        },
        technologies: {
          type: "array",
          items: {
            type: "string",
          },
        },
      },
      required: ["description", "technologies"],
      additionalProperties: false,
    };

    const responseFormat: ResponseFormat = {
      type: "json_schema",
      jsonSchema: {
        name: "project-analysis",
        strict: true,
        schema: responseSchema,
      },
    };

    const systemMessage: Message = {
      role: "system",
      content:
        "Jesteś ekspertem w analizie kodu źródłowego. Analizujesz pliki kodu i generujesz opis projektu oraz listę użytych technologii. " +
        "Opis powinien być zwięzły (2-4 zdania) i zawierać główne informacje o projekcie. Opis powinien byc w języku polskim. Maksymalna długość opisu to 1000 znaków. Minimalna długość opisu to 200 znaków. " +
        "Technologie powinny być listą konkretnych nazw technologii (np. TypeScript, React, Node.js, Tailwind CSS). Maksymalna i pożądana ilość technologii to 10, a minimalna to 1." +
        "Odpowiedz TYLKO czystym JSON bez żadnych znaczników Markdown, code blocków (np. bez ```json), dodatkowych tekstów czy wyjaśnień. " +
        'Użyj dokładnie tego formatu: {"description": "...", "technologies": ["tech1", "tech2"]}. ' +
        "JSON musi być zgodny z podanym schematem i zawierać pola 'description' (string) oraz 'technologies' (array of strings).",
    };

    const filesSummary = filesContent
      .map((content, index) => {
        const preview = content.split("\n").slice(0, 50).join("\n"); // First 50 lines
        return `--- Plik ${index + 1} ---\n${preview}${content.split("\n").length > 50 ? "\n[...]" : ""}`;
      })
      .join("\n\n");

    const userMessage: Message = {
      role: "user",
      content: `Przeanalizuj poniższe pliki kodu i wygeneruj opis projektu oraz listę technologii:\n\n${filesSummary}`,
    };

    // Get model sequence
    const modelSequence = enableFallback ? getFallbackModelSequence() : [getFallbackModelSequence()[0]];
    const messages = [systemMessage, userMessage];

    let lastError: Error | null = null;

    // Try each model in sequence
    for (let i = 0; i < modelSequence.length; i++) {
      const model = modelSequence[i];
      const isLastModel = i === modelSequence.length - 1;

      try {
        // Call OpenRouter API with specific model
        const response = await this._openRouterService.generateResponse(messages, {
          model,
          parameters: {
            temperature: 0.7,
            maxTokens: 1000,
          },
          responseFormat,
        });

        // Extract structured data
        if (response.structuredData) {
          const structured = response.structuredData as { description: string; technologies: string[] };
          const parsed = this.parseAIResponse({
            content: JSON.stringify({
              description: structured.description,
              technologies: structured.technologies,
            }),
          });
          return parsed;
        }

        // Fallback to parsing content if structured data not available
        const parsed = this.parseAIResponse({ content: response.content });
        return parsed;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Log error for debugging
        console.error(`Error calling AI model ${model} for project ${projectId}:`, lastError);
        console.error(
          `Error type: ${error instanceof OpenRouterError ? "OpenRouterError" : error instanceof ValidationError ? "ValidationError" : error instanceof TypeError ? "TypeError" : "Unknown"}`
        );
        if (error instanceof OpenRouterError) {
          console.error(`Error status code: ${error.statusCode}`);
        }

        // Check if this is a retryable error:
        // - 404 Not Found (model not available, try next model)
        // - 429 rate limit (should try next model)
        // - 5xx server errors (should try next model)
        // - Network errors (TypeError from fetch)
        // - ValidationError from OpenRouter (might be model-specific, try next)
        const isRetryableError =
          (error instanceof OpenRouterError &&
            (error.statusCode === 404 ||
              error.statusCode === 429 ||
              (error.statusCode !== undefined && error.statusCode >= 500))) ||
          error instanceof TypeError ||
          error instanceof ValidationError;

        console.log(`Is retryable error: ${isRetryableError}, isLastModel: ${isLastModel}`);

        // If it's not a retryable error (e.g., 4xx validation errors that are not 429 or 404),
        // throw immediately only if it's not a ValidationError (which might be model-specific)
        if (!isRetryableError) {
          // Only throw immediately for non-retryable errors (like 401, 403, etc.)
          // Note: 404 is retryable (model not available), 429 is retryable (rate limit)
          if (
            error instanceof OpenRouterError &&
            error.statusCode !== undefined &&
            error.statusCode < 500 &&
            error.statusCode !== 429 &&
            error.statusCode !== 404
          ) {
            console.log(`Throwing non-retryable error immediately: ${error.message}`);
            throw error;
          }
          // For other errors, if it's the last model, throw; otherwise try next
          if (isLastModel) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.log(`Last model failed with non-retryable error, throwing: ${errorMsg}`);
            throw error;
          }
          // Try next model for unknown errors
          console.log(
            `Unknown error occurred, retrying with next fallback model (attempt ${i + 1}/${modelSequence.length})`
          );
          continue;
        }

        // If this is the last model and we have a retryable error, we'll throw FallbackExhaustedError below
        if (isLastModel) {
          console.log(`Last model failed with retryable error, will throw FallbackExhaustedError`);
          break;
        }

        // Continue to next model for retryable errors
        console.log(`Retrying with next fallback model (attempt ${i + 1}/${modelSequence.length})`);
      }
    }

    // All models failed
    console.error(`All ${modelSequence.length} models failed for project ${projectId}. Last error:`, lastError);
    throw new FallbackExhaustedError();
  }
}
