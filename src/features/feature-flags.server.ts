import { FeatureFlags, DEFAULT_FEATURE_FLAGS } from "./feature-flags";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Sprawdza flagę bezpośrednio z bazy (bez cache)
 * Używa się w API endpoints i Astro pages gdy potrzebujemy zawsze aktualnej wartości z bazy
 */
export async function checkFeatureFlagDirectly(supabase: SupabaseClient, flag: FeatureFlags): Promise<boolean> {
  try {
    const { data, error } = await supabase.from("feature_flags").select("enabled").eq("name", flag).single();

    if (error || !data) {
      console.error(`Failed to check feature flag ${flag}:`, error);
      return DEFAULT_FEATURE_FLAGS[flag] ?? false;
    }

    return data.enabled ?? false;
  } catch (err) {
    console.error(`Error checking feature flag ${flag}:`, err);
    return DEFAULT_FEATURE_FLAGS[flag] ?? false;
  }
}
