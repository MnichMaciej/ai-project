// Enum nazw flag - centralne miejsce, type-safe
export enum FeatureFlags {
  AI_GENERATION = "AI_GENERATION",
}

// Type-safe map dla runtime
export type FeatureFlagMap = Record<FeatureFlags, boolean>;

// Config z wartościami domyślnymi (fallback)
export const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = Object.values(FeatureFlags).reduce(
  (acc, flag) => ({ ...acc, [flag]: false }),
  {} as FeatureFlagMap
);
