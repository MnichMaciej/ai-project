# System Feature Flags - Specyfikacja Implementacji

## 1. Przegląd

System feature flags umożliwia rozdzielenie deploymentów od releasów. Flagi są przechowywane w bazie danych Supabase i mogą być sprawdzane w runtime aplikacji na poziomie:
- Endpointów API
- Stron Astro
- Komponentów React
- Hooks'ów

Flagi są globalne (boolean true/false) i wspólne dla całej instancji aplikacji. Każde środowisko (development, staging, production) ma swoją własną instancję bazy danych z właściwymi wartościami flag.

---

## 2. Schemat Bazy Danych Supabase

```sql
CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index dla szybkich lookupów
CREATE INDEX idx_feature_flags_name ON feature_flags(name);
```

**Dane testowe:**
```sql
INSERT INTO feature_flags (name, enabled, description) VALUES
('AI_GENERATION', false, 'AI text generation feature'),
('ANALYTICS', false, 'Analytics tracking'),
('NEW_DASHBOARD', false, 'New dashboard interface');
```

**Migracja Supabase:**
```
supabase/migrations/[timestamp]_create_feature_flags_table.sql
```

---

## 3. Struktura Modułu `src/features/`

```
src/features/
├─ feature-flags.ts              # Enum nazw flag + types + defaults
├─ feature-flags.service.ts      # Service do sprawdzania flag (universal)
├─ feature-flags.server.ts       # Server-only helpers (fetch z Supabase)
└─ index.ts                       # Exports
```

---

## 4. Pliki Modułu - Szczegółowy Projekt

### **A. `src/features/feature-flags.ts`**

```typescript
// Enum nazw flag - centralne miejsce, type-safe
export enum FeatureFlags {
  AI_GENERATION = 'AI_GENERATION',
  ANALYTICS = 'ANALYTICS',
  NEW_DASHBOARD = 'NEW_DASHBOARD',
  // Dodaj nowe flagi tutaj
}

// Type-safe map dla runtime
export type FeatureFlagMap = Record<FeatureFlags, boolean>;

// Config z wartościami domyślnymi (fallback)
export const DEFAULT_FEATURE_FLAGS: FeatureFlagMap = {
  [FeatureFlags.AI_GENERATION]: false,
  [FeatureFlags.ANALYTICS]: false,
  [FeatureFlags.NEW_DASHBOARD]: false,
};
```

---

### **B. `src/features/feature-flags.service.ts`** (Universal)

```typescript
import { FeatureFlags, FeatureFlagMap, DEFAULT_FEATURE_FLAGS } from './feature-flags';

/**
 * Global cache dla flag - załadowane raz z DB
 * Persystuje przez cały lifecycle aplikacji
 */
let flagsCache: FeatureFlagMap | null = null;

/**
 * Sprawdza czy feature flaga jest włączona
 * - Na backendzie: czyta z cache (załadowany w middleware)
 * - Na frontendzie: czyta z cache (SSR context)
 * 
 * Zwraca default (false) jeśli flaga nie załadowana
 */
export function isFeatureEnabled(flag: FeatureFlags): boolean {
  if (flagsCache === null) {
    // Fallback na default jeśli cache nie załadowany
    return DEFAULT_FEATURE_FLAGS[flag] ?? false;
  }
  return flagsCache[flag] ?? false;
}

/**
 * Załaduj flagi do cache (wewnętrzne)
 * Uruchamiaj przy starcie aplikacji (w middleware)
 */
export function setFlagsCache(flags: FeatureFlagMap): void {
  flagsCache = flags;
}

/**
 * Zwróć aktualny cache (dla debug)
 */
export function getFlagsCache(): FeatureFlagMap | null {
  return flagsCache;
}

/**
 * Clear cache (dla testów i reinicjalizacji)
 */
export function clearFlagsCache(): void {
  flagsCache = null;
}
```

---

### **C. `src/features/feature-flags.server.ts`** (Server-only)

```typescript
import { FeatureFlags, FeatureFlagMap, DEFAULT_FEATURE_FLAGS } from './feature-flags';
import { setFlagsCache } from './feature-flags.service';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetch flagi z Supabase
 * Uruchamiaj raz w aplikacji (np. w middleware przy starcie)
 */
export async function loadFeatureFlags(
  supabase: SupabaseClient
): Promise<FeatureFlagMap> {
  try {
    const { data, error } = await supabase
      .from('feature_flags')
      .select('name, enabled');

    if (error) {
      console.error('Failed to load feature flags:', error);
      return getDefaultFlags();
    }

    // Build map z danych
    const flagsMap: FeatureFlagMap = getDefaultFlags();
    if (data && Array.isArray(data)) {
      data.forEach(({ name, enabled }) => {
        if (name in FeatureFlags) {
          flagsMap[name as FeatureFlags] = enabled;
        }
      });
    }

    // Załaduj do cache
    setFlagsCache(flagsMap);
    return flagsMap;
  } catch (err) {
    console.error('Error loading feature flags:', err);
    return getDefaultFlags();
  }
}

/**
 * Helper - default flags
 */
function getDefaultFlags(): FeatureFlagMap {
  return { ...DEFAULT_FEATURE_FLAGS };
}
```

---

### **D. `src/features/index.ts`** (Exports)

```typescript
export { FeatureFlags, DEFAULT_FEATURE_FLAGS } from './feature-flags';
export type { FeatureFlagMap } from './feature-flags';
export { isFeatureEnabled, getFlagsCache, clearFlagsCache } from './feature-flags.service';
export { loadFeatureFlags } from './feature-flags.server';
```

---

## 5. Integracja w Middleware

W `src/middleware/index.ts` - dodaj na początku:

```typescript
import { defineMiddleware } from 'astro:middleware';
import { loadFeatureFlags } from '@/features/feature-flags.server';
import { createClient } from '@supabase/supabase-js';

export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Załaduj flagi z Supabase przy każdym request
  const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY
  );
  
  try {
    await loadFeatureFlags(supabase);
  } catch (err) {
    console.error('Failed to load feature flags in middleware:', err);
    // App zachowa default flags (false)
  }

  return next();
});
```

---

## 6. Użycie w Aplikacji

### **Na Backendzie (API Endpoint)**

```typescript
// src/pages/api/projects/[id]/ai-generate.ts
import { isFeatureEnabled, FeatureFlags } from '@/features';

export const POST = async (context) => {
  // Early return jeśli flaga wyłączona
  if (!isFeatureEnabled(FeatureFlags.AI_GENERATION)) {
    return new Response(
      JSON.stringify({ error: 'AI generation not available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Reszta logiki...
};
```

---

### **Na Frontendzie (Komponenty React)**

```typescript
// src/components/ai/AISection.tsx
import { isFeatureEnabled, FeatureFlags } from '@/features';

export const AISection = ({ projectId, onAIGenerate }) => {
  // Flaga wyłączona - component nie renderuje nic (HIDDEN)
  if (!isFeatureEnabled(FeatureFlags.AI_GENERATION)) {
    return null;
  }

  return (
    <div className="ai-section">
      {/* Całe UI sekcji */}
    </div>
  );
};
```

---

### **Na Frontendzie (Komponenty Astro)**

```astro
<!-- src/pages/projects/[id].astro -->
---
import { isFeatureEnabled, FeatureFlags } from '@/features';

const isAIEnabled = isFeatureEnabled(FeatureFlags.AI_GENERATION);
---

<Layout>
  {isAIEnabled && <AIGenerateButton client:load />}
  {/* reszta strony */}
</Layout>
```

---

## 7. Integracja Feature Flagi `AI_GENERATION`

Na podstawie planów implementacji AI, flaga będzie zintegrowana w:

### **Backend**
```
✅ src/pages/api/projects/[id]/ai-generate.ts
   └─ Early return z 503 jeśli flaga wyłączona
   └─ Zapobieganie wykonywaniu logiki AI
```

### **Frontend - Komponenty (HIDDEN, NIE DISABLED)**
```
✅ src/components/ai/AISection.tsx
   └─ return null jeśli flaga wyłączona
   └─ Całe UI schowane

✅ src/components/ProjectForm.tsx
   └─ Nie renderuj <AISection /> jeśli flaga wyłączona
   └─ Clean layout bez zmian

✅ src/lib/hooks/useAIGeneration.ts
   └─ Early exit jeśli flaga wyłączona
   └─ Ochrona przed pointless API calls
```

**Ważne:** Button AI będzie **HIDDEN** (nie renderowany), a nie disabled. Gdy flaga wyłączona - żaden element AI nie będzie widoczny w UI.

---

## 8. Caching i Performance

- **Załadowanie flag:** Raz per request w middleware
- **Cache:** In-memory, przechowywane przez cały lifecycle aplikacji
- **Default values:** false (conservative - feature wyłączona)
- **Fallback:** Jeśli query do DB fail - app używa default values
- **Brak TTL/polling:** Flagi zmieniane tylko przy deployment nowego kodu

---

## 9. Rozszerzanie w Przyszłości

Gdy będziesz potrzebować dynamicznych zmian flag (bez restartu):
1. Dodać webhook z Supabase
2. Implement refresh mechanizm w middleware
3. Broadcast změny do klientów (via WebSocket lub polling)

Obecna implementacja nie wymaga tych zmian i jest optimized dla statycznych flag.

---

## 10. Czeklistka przed Implementacją

- [ ] Utworzyć migrację Supabase dla tabeli `feature_flags`
- [ ] Seedować dane testowe (flagi dla każdego środowiska)
- [ ] Utworzyć pliki w `src/features/`
- [ ] Zaktualizować `src/middleware/index.ts`
- [ ] Zintegrować w `AISection.tsx` - conditional render
- [ ] Zintegrować w API endpoint `[id]/ai-generate.ts` - early return
- [ ] Zintegrować w `useAIGeneration.ts` hook
- [ ] Testy: Unit test service, E2E test z flagą on/off

---

## 11. Przykład Pełnego Workflow

1. **Startup aplikacji**
   - Middleware ładuje flagi z Supabase
   - Flagi przechowywane w cache

2. **Rendering strony /projects/[id]**
   - `isFeatureEnabled(FeatureFlags.AI_GENERATION)` zwraca `false` (production)
   - `AISection` nie jest renderowana
   - UI jest czysty bez artefaktów

3. **User klika form**
   - Nie ma opcji do generowania z AI
   - Formularz działa normalnie bez AI

4. **Deploy z flagą enabled**
   - Zmiana w bazie danych Supabase
   - Nowy deployment aplikacji
   - Middleware załaduje nowe flagi
   - AI feature widoczne dla użytkowników

---

## 12. Environment-specific Deployment

Każde środowisko ma:
- Własną instancję bazy Supabase (lub separate project/schema)
- Własne wartości flag w tabeli `feature_flags`

Beispiel:
- **Development DB**: `AI_GENERATION = true`
- **Staging DB**: `AI_GENERATION = true`
- **Production DB**: `AI_GENERATION = false` (release gdy gotowe)

