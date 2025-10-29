/**
 * AIService - Handles AI-related operations for project generation
 * Mocks GitHub file fetching and Openrouter AI calls for now
 */
export class AIService {
  async fetchFilesFromGitHub(fileLinks: string[]): Promise<string[]> {
    const MAX_FILE_SIZE = 100 * 1024;

    try {
      const fileContents = await Promise.all(
        fileLinks.map(async (url) => {
          if (!url.includes("raw.githubusercontent.com")) {
            throw new Error(`Invalid GitHub URL: ${url}`);
          }

          const mockContent = `Mock file content for: ${url}\n// This is a mocked file content`;
          const sizeInBytes = new TextEncoder().encode(mockContent).length;

          if (sizeInBytes > MAX_FILE_SIZE) {
            throw new Error(`File exceeds 100KB limit: ${url}`);
          }

          return mockContent;
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
      const fileCount = filesContent.length;

      const mockDescription =
        `This is a mock-generated project description based on ${fileCount} file(s). ` +
        `In production, this would be analyzed by an AI model. The project appears to use TypeScript, React, and Node.js. `;

      const mockTechnologies = ["TypeScript", "React", "Node.js", "Tailwind CSS"];

      const jsonResponse = {
        description: mockDescription,
        technologies: mockTechnologies,
      };

      return {
        content: JSON.stringify(jsonResponse),
      };
    } catch (error) {
      console.error("Error calling Openrouter AI:", error);
      throw new Error(`Failed to generate AI response: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  parseAIResponse(aiResponse: { content: string }): {
    description: string;
    technologies: string[];
  } {
    try {
      const parsed = JSON.parse(aiResponse.content);

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
