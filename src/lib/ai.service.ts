import { OpenRouterService, OpenRouterError, ValidationError } from "./openrouter.service.ts";
import type { Message, ResponseFormat, JsonSchema } from "../types.ts";

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
}
