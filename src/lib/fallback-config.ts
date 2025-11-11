import type { FallbackModelConfig } from "../types";

/**
 * Fallback model configuration for AI service
 * Defines the sequence of models to use when the default model fails
 */
export const FALLBACK_MODEL_CONFIG: FallbackModelConfig = {
  default: "google/gemini-2.0-flash-exp:free",
  fallbacks: ["deepseek/deepseek-chat-v3.1:free", "kwaipilot/kat-coder-pro:free"],
};

/**
 * Gets the list of all models in fallback sequence (default + fallbacks)
 * Frontend cannot choose models, so we always use the default sequence
 */
export function getFallbackModelSequence(): string[] {
  return [FALLBACK_MODEL_CONFIG.default, ...FALLBACK_MODEL_CONFIG.fallbacks];
}

/**
 * Validates if a model ID is in the allowed fallback sequence
 */
export function isValidFallbackModel(modelId: string): boolean {
  const allModels = getFallbackModelSequence();
  return allModels.includes(modelId);
}
