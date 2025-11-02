import type { Message, GenerateOptions, JsonSchema, GenerateResponse } from "../../types.js";

class OpenRouterError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenRouterError";
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class OpenRouterService {
  private _apiKey: string;
  private _baseUrl: string;
  private _defaultModel: string;

  constructor(apiKey: string, baseUrl?: string, defaultModel?: string) {
    if (!apiKey) {
      throw new OpenRouterError("Invalid API key");
    }
    this._apiKey = apiKey;
    this._baseUrl = baseUrl || "https://openrouter.ai/api/v1";
    this._defaultModel = defaultModel || "google/gemini-2.0-flash-exp:free";
  }

  private async _makeRequest(endpoint: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
    const url = `${this._baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this._apiKey}`,
      "Content-Type": "application/json",
    };

    let attempt = 1;
    while (attempt <= 3) {
      try {
        const response = await fetch(url, {
          ...init,
          headers: {
            ...headers,
            ...init.headers,
          },
        });

        if (!response.ok) {
          let errorMessage = `HTTP error! status: ${response.status}`;
          if (response.status === 401) {
            errorMessage = "Authentication failed - invalid API key";
          } else if (response.status === 429) {
            errorMessage = "Rate limit exceeded, please try again later";
          }
          throw new OpenRouterError(errorMessage);
        }

        return await response.json();
      } catch (error) {
        if (attempt === 3) {
          console.error(`OpenRouter request failed after ${attempt} attempts:`, error);
          throw error instanceof OpenRouterError ? error : new OpenRouterError("Network error or service unavailable");
        }
        // Exponential backoff: 1s, 2s, 4s
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
        attempt++;
      }
    }
    throw new OpenRouterError("Unexpected error in request handling");
  }

  private _buildRequestBody(messages: Message[], options: GenerateOptions): Record<string, unknown> {
    const effectiveOptions: GenerateOptions = {
      model: options.model || this._defaultModel,
      parameters: options.parameters,
      responseFormat: options.responseFormat,
    };

    // Sanitize messages to prevent injection (escape HTML/script tags in content)
    const sanitizedMessages = messages.map((msg) => ({
      ...msg,
      content: msg.content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim(),
    }));

    const body: Record<string, unknown> = {
      model: effectiveOptions.model,
      messages: sanitizedMessages,
    };

    if (effectiveOptions.parameters) {
      const params = effectiveOptions.parameters;
      // Map camelCase to snake_case for API
      if (params.temperature !== undefined) {
        body.temperature = params.temperature;
      }
      if (params.maxTokens !== undefined) {
        body.max_tokens = params.maxTokens;
      }
      if (params.topP !== undefined) {
        body.top_p = params.topP;
      }
      if (params.frequencyPenalty !== undefined) {
        body.frequency_penalty = params.frequencyPenalty;
      }
      if (params.presencePenalty !== undefined) {
        body.presence_penalty = params.presencePenalty;
      }

      // Add any additional parameters
      Object.keys(params).forEach((key) => {
        if (!["temperature", "maxTokens", "topP", "frequencyPenalty", "presencePenalty"].includes(key)) {
          body[key] = params[key];
        }
      });
    }

    if (effectiveOptions.responseFormat) {
      body.response_format = {
        type: effectiveOptions.responseFormat.type,
        json_schema: {
          name: effectiveOptions.responseFormat.jsonSchema.name,
          strict: effectiveOptions.responseFormat.jsonSchema.strict,
          schema: effectiveOptions.responseFormat.jsonSchema.schema,
        },
      };
    }

    return body;
  }

  private _parseResponse(response: Record<string, unknown>, schema?: JsonSchema): GenerateResponse {
    if (!response || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new ValidationError("Invalid response from OpenRouter API");
    }

    const choices = response.choices as Record<string, unknown>[];
    const choice = choices[0];
    const message = choice.message as Record<string, unknown> | undefined;
    const content = (message?.content as string | undefined) || "";

    if (!content) {
      throw new ValidationError("Empty response content from API");
    }

    const result: GenerateResponse = {
      content,
    };

    // Parse structured data if schema provided
    if (schema && schema.type === "json_schema") {
      try {
        const parsed = JSON.parse(content);
        result.structuredData = parsed;

        // Basic validation - check if parsed data matches expected structure
        // Note: Full JSON Schema validation would require a more sophisticated validator
        // For now, we do basic type checking
        if (schema.required && Array.isArray(schema.required)) {
          const parsedObj = parsed as Record<string, unknown>;
          for (const field of schema.required) {
            if (!(field in parsedObj) || parsedObj[field] === undefined) {
              throw new ValidationError(`Missing required field: ${field}`);
            }
          }
        }
      } catch (parseError) {
        if (parseError instanceof ValidationError) {
          throw parseError;
        }
        console.error("Parsing structured response failed:", parseError);
        throw new ValidationError("Invalid JSON format in structured response");
      }
    }

    // Extract usage information
    const usage = response.usage as Record<string, unknown> | undefined;
    if (usage) {
      result.usage = {
        promptTokens: (usage.prompt_tokens as number | undefined) || 0,
        completionTokens: (usage.completion_tokens as number | undefined) || 0,
        totalTokens: (usage.total_tokens as number | undefined) || 0,
      };
    }

    return result;
  }
}
