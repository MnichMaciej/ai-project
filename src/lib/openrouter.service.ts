import type { GenerateOptions, GenerateResponse, JsonSchema, Message, ModelInfo } from "../types.ts";

// Custom error classes
export class OpenRouterError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number
  ) {
    super(message);
    this.name = "OpenRouterError";
    Object.setPrototypeOf(this, OpenRouterError.prototype);
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ValidationError";
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class OpenRouterService {
  private readonly _apiKey: string;
  private readonly _baseUrl: string;
  private readonly _defaultModel: string;
  private readonly _maxRetries = 3;
  private readonly _retryDelays = [1000, 2000, 4000]; // Exponential backoff in ms

  constructor(apiKey: string, baseUrl?: string, defaultModel?: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new OpenRouterError("Invalid API key");
    }

    this._apiKey = apiKey;
    this._baseUrl = baseUrl || "https://openrouter.ai/api/v1";
    this._defaultModel = defaultModel || "google/gemini-2.0-flash-exp:free";
  }

  /**
   * Generates a response using OpenRouter API
   */
  async generateResponse(messages: Message[], options?: GenerateOptions): Promise<GenerateResponse> {
    if (!messages || messages.length === 0) {
      throw new ValidationError("Messages array cannot be empty");
    }

    // Validate messages structure
    for (const msg of messages) {
      if (!msg.role || !["system", "user", "assistant"].includes(msg.role)) {
        throw new ValidationError(`Invalid message role: ${msg.role}`);
      }
      if (!msg.content || typeof msg.content !== "string") {
        throw new ValidationError("Message content must be a non-empty string");
      }
    }

    // Validate response format schema if provided
    if (options?.responseFormat?.jsonSchema?.schema) {
      const isValid = this.validateSchema(options.responseFormat.jsonSchema.schema);
      if (!isValid) {
        throw new ValidationError("Invalid JSON schema in response format");
      }
    }

    // Validate model parameters if provided
    if (options?.parameters) {
      this._validateParameters(options.parameters);
    }

    const requestBody = this._buildRequestBody(messages, options);
    const response = await this._makeRequest("/chat/completions", requestBody);
    return this._parseResponse(response, options?.responseFormat);
  }

  /**
   * Gets available models from OpenRouter API
   */
  async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await this._makeRequest("/models", null, "GET");
      const models = response.data || [];

      if (!Array.isArray(models)) {
        throw new ValidationError("Invalid response format: expected array of models");
      }

      return models
        .filter((model: unknown) => model && typeof model === "object" && "id" in model) // Filter out invalid entries
        .map((model: Record<string, unknown>) => {
          const id = String(model.id);
          const name = String(model.name || model.id);
          const description = model.description ? String(model.description) : undefined;

          let pricing: ModelInfo["pricing"] = undefined;
          if (model.pricing && typeof model.pricing === "object") {
            const pricingObj = model.pricing as Record<string, unknown>;
            pricing = {
              prompt: String(pricingObj.prompt || ""),
              completion: String(pricingObj.completion || ""),
            };
          }

          let architecture: ModelInfo["architecture"] = undefined;
          if (model.architecture && typeof model.architecture === "object") {
            const archObj = model.architecture as Record<string, unknown>;
            architecture = {
              modality: String(archObj.modality || ""),
              tokenizer: String(archObj.tokenizer || ""),
              instructType: archObj.instruct_type ? String(archObj.instruct_type) : undefined,
            };
          }

          return {
            id,
            name,
            description,
            pricing,
            contextLength: model.context_length ? Number(model.context_length) : undefined,
            architecture,
          };
        });
    } catch (error) {
      console.error("Error fetching available models:", error);
      throw error instanceof OpenRouterError ? error : new OpenRouterError("Failed to fetch available models");
    }
  }

  /**
   * Validates model parameters
   */
  private _validateParameters(parameters: GenerateOptions["parameters"]): void {
    if (!parameters) {
      return;
    }

    if (parameters.temperature !== undefined) {
      if (typeof parameters.temperature !== "number" || parameters.temperature < 0 || parameters.temperature > 2) {
        throw new ValidationError("Temperature must be a number between 0 and 2");
      }
    }

    if (parameters.maxTokens !== undefined) {
      if (typeof parameters.maxTokens !== "number" || parameters.maxTokens < 1 || parameters.maxTokens > 100000) {
        throw new ValidationError("MaxTokens must be a number between 1 and 100000");
      }
    }

    if (parameters.topP !== undefined) {
      if (typeof parameters.topP !== "number" || parameters.topP < 0 || parameters.topP > 1) {
        throw new ValidationError("TopP must be a number between 0 and 1");
      }
    }

    if (parameters.frequencyPenalty !== undefined) {
      if (
        typeof parameters.frequencyPenalty !== "number" ||
        parameters.frequencyPenalty < -2 ||
        parameters.frequencyPenalty > 2
      ) {
        throw new ValidationError("FrequencyPenalty must be a number between -2 and 2");
      }
    }

    if (parameters.presencePenalty !== undefined) {
      if (
        typeof parameters.presencePenalty !== "number" ||
        parameters.presencePenalty < -2 ||
        parameters.presencePenalty > 2
      ) {
        throw new ValidationError("PresencePenalty must be a number between -2 and 2");
      }
    }
  }

  /**
   * Validates a JSON schema structure
   */
  validateSchema(schema: JsonSchema): boolean {
    if (!schema || typeof schema !== "object") {
      return false;
    }

    if (!schema.type || typeof schema.type !== "string") {
      return false;
    }

    if (schema.properties && typeof schema.properties !== "object") {
      return false;
    }

    if (schema.items && typeof schema.items !== "object") {
      return false;
    }

    if (schema.required && !Array.isArray(schema.required)) {
      return false;
    }

    // Recursively validate nested schemas
    if (schema.properties) {
      for (const propSchema of Object.values(schema.properties)) {
        if (!this.validateSchema(propSchema as JsonSchema)) {
          return false;
        }
      }
    }

    if (schema.items && !this.validateSchema(schema.items)) {
      return false;
    }

    return true;
  }

  /**
   * Makes HTTP request to OpenRouter API with retry logic
   */
  private async _makeRequest(
    endpoint: string,
    body: unknown,
    method: "POST" | "GET" = "POST"
  ): Promise<Record<string, unknown>> {
    const url = `${this._baseUrl}${endpoint}`;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this._maxRetries; attempt++) {
      try {
        const headers: Record<string, string> = {
          Authorization: `Bearer ${this._apiKey}`,
          "Content-Type": "application/json",
        };

        const requestOptions: RequestInit = {
          method,
          headers,
        };

        if (method === "POST" && body) {
          requestOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, requestOptions);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage = errorData.error?.message || `API request failed with status ${response.status}`;

          // Don't retry on 4xx errors (except 429 - rate limit)
          if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            throw new OpenRouterError(errorMessage, response.status);
          }

          // Retry on 5xx errors and 429
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter, 10) * 1000 : this._retryDelays[attempt] || 4000;
            await this._delay(delay);
            lastError = new OpenRouterError("Rate limit exceeded. Retrying...", response.status);
            continue;
          }

          throw new OpenRouterError(errorMessage, response.status);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Network errors - retry with exponential backoff
        if (
          error instanceof TypeError ||
          (error instanceof OpenRouterError && error.statusCode && error.statusCode >= 500)
        ) {
          if (attempt < this._maxRetries - 1) {
            const delay = this._retryDelays[attempt] || 4000;
            await this._delay(delay);
            continue;
          }
        }

        // Non-retryable errors
        if (
          error instanceof OpenRouterError &&
          error.statusCode &&
          error.statusCode < 500 &&
          error.statusCode !== 429
        ) {
          throw error;
        }
      }
    }

    // All retries exhausted
    console.error("OpenRouter API request failed after retries:", lastError);
    throw new OpenRouterError("Serwis AI jest chwilowo niedostępny, spróbuj później.");
  }

  /**
   * Builds request body for OpenRouter API
   */
  private _buildRequestBody(messages: Message[], options?: GenerateOptions): Record<string, unknown> {
    const sanitizedMessages = messages.map((msg) => ({
      role: msg.role,
      content: this._sanitizeContent(msg.content),
    }));

    const requestBody: Record<string, unknown> = {
      model: options?.model || this._defaultModel,
      messages: sanitizedMessages,
    };

    // Add model parameters
    if (options?.parameters) {
      const params = options.parameters;
      if (params.temperature !== undefined) {
        requestBody.temperature = params.temperature;
      }
      if (params.maxTokens !== undefined) {
        requestBody.max_tokens = params.maxTokens;
      }
      if (params.topP !== undefined) {
        requestBody.top_p = params.topP;
      }
      if (params.frequencyPenalty !== undefined) {
        requestBody.frequency_penalty = params.frequencyPenalty;
      }
      if (params.presencePenalty !== undefined) {
        requestBody.presence_penalty = params.presencePenalty;
      }

      // Add any additional parameters
      Object.keys(params).forEach((key) => {
        if (!["temperature", "maxTokens", "topP", "frequencyPenalty", "presencePenalty"].includes(key)) {
          requestBody[key] = params[key];
        }
      });
    }

    // Add response format if provided
    if (options?.responseFormat) {
      requestBody.response_format = {
        type: options.responseFormat.type,
        json_schema: {
          name: options.responseFormat.jsonSchema.name,
          strict: options.responseFormat.jsonSchema.strict,
          schema: options.responseFormat.jsonSchema.schema,
        },
      };
    }

    return requestBody;
  }

  /**
   * Parses response from OpenRouter API
   */
  private _parseResponse(
    response: Record<string, unknown>,
    responseFormat?: GenerateOptions["responseFormat"]
  ): GenerateResponse {
    if (!response || !Array.isArray(response.choices) || response.choices.length === 0) {
      throw new ValidationError("Invalid response format from API");
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

    // Parse structured data if response format was requested
    if (responseFormat && responseFormat.type === "json_schema") {
      try {
        console.log(content);
        const cleanedContent = this._cleanMarkdown(content);
        const parsed = JSON.parse(cleanedContent);
        result.structuredData = parsed;

        // Validate against schema if strict mode
        if (responseFormat.jsonSchema.strict) {
          const isValid = this._validateStructuredData(parsed, responseFormat.jsonSchema.schema);
          if (!isValid) {
            throw new ValidationError("Structured data does not match the provided schema", {
              parsed,
              schema: responseFormat.jsonSchema.schema,
            });
          }
        }
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        // Fallback to raw content if parsing fails
        console.warn("Failed to parse structured response, using raw content:", error);
        result.structuredData = undefined;
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

  /**
   * Sanitizes user content to prevent injection attacks
   * Since we use JSON.stringify for request body, basic validation is sufficient
   */
  private _sanitizeContent(content: string): string {
    if (typeof content !== "string") {
      return String(content);
    }

    // Basic validation - ensure content is not empty and is a valid string
    // JSON.stringify will handle proper escaping in the request body
    return content.trim();
  }

  /**
   * Cleans Markdown formatting from AI response content, removing code blocks like ```json
   */
  private _cleanMarkdown(content: string): string {
    let cleaned = content.trim();

    // Remove ```json ... ``` or ``` ... ``` blocks
    const jsonBlockRegex = /^```(?:json)?\s*\n([\s\S]*?)\n```$/gm;
    const match = jsonBlockRegex.exec(cleaned);
    if (match) {
      cleaned = match[1].trim();
    }

    // Remove leading/trailing whitespace and empty lines
    cleaned = cleaned.replace(/^\s*[\r\n]+|[\s\S]*?[\r\n]+\s*$/g, "").trim();

    // Remove any inline comments if present
    cleaned = cleaned.replace(/^\s*\/\/.*$/gm, "");

    return cleaned;
  }

  /**
   * Validates structured data against JSON schema
   */
  private _validateStructuredData(data: unknown, schema: JsonSchema): boolean {
    if (!schema || typeof schema !== "object") {
      return false;
    }

    // Type validation
    if (schema.type === "object") {
      if (typeof data !== "object" || data === null || Array.isArray(data)) {
        return false;
      }

      const dataObj = data as Record<string, unknown>;

      // Check required fields
      if (schema.required) {
        for (const field of schema.required) {
          if (!(field in dataObj)) {
            return false;
          }
        }
      }

      // Validate properties
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in dataObj) {
            if (!this._validateStructuredData(dataObj[key], propSchema as JsonSchema)) {
              return false;
            }
          }
        }
      }

      // Check additionalProperties
      if (schema.additionalProperties === false) {
        const allowedKeys = new Set([...(schema.required || []), ...Object.keys(schema.properties || {})]);
        for (const key of Object.keys(dataObj)) {
          if (!allowedKeys.has(key)) {
            return false;
          }
        }
      }
    } else if (schema.type === "array") {
      if (!Array.isArray(data)) {
        return false;
      }

      if (schema.items) {
        for (const item of data) {
          if (!this._validateStructuredData(item, schema.items)) {
            return false;
          }
        }
      }
    } else if (schema.type === "string") {
      if (typeof data !== "string") {
        return false;
      }
    } else if (schema.type === "number") {
      if (typeof data !== "number") {
        return false;
      }
    } else if (schema.type === "boolean") {
      if (typeof data !== "boolean") {
        return false;
      }
    }

    return true;
  }

  /**
   * Delays execution for the specified milliseconds
   */
  private _delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
