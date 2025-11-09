# Podsumowanie Refaktoryzacji Projektów - Kontekst dla Naprawy Błędów

## Przegląd Zmian

Refaktoryzacja komponentów formularzy projektów została przeprowadzona w trzech fazach:

1. **Warstwa API Service** - centralizacja wywołań API
2. **Ekstrakcja komponentów** - wydzielenie pól formularza
3. **Optymalizacja React Hook Form** - użycie FormProvider i useFormContext

## Nowe Pliki Utworzone

### 1. API Service Layer

- **`src/lib/services/project.service.ts`** - Klasa ProjectService wzorowana na AuthService
  - Metody: `createProject()`, `getProject()`, `updateProject()`, `getProjectQueryCount()`, `generateAI()`
  - Obsługa anulowania żądań przez `requestId` i `cancelRequest()`
  - Używa `parseApiError()` z `error.utils.ts` do obsługi błędów

### 2. Hooks

- **`src/lib/hooks/useTechnologyManagement.ts`** - Hook do zarządzania listą technologii
  - Używa `useWatch` zamiast `watch()` dla lepszej wydajności
  - Zwraca: `technologies`, `newTechnology`, `setNewTechnology`, `addTechnology`, `removeTechnology`, `handleTechnologyKeyPress`, `canAddMore`, `isAtMax`

### 3. Komponenty Pól Formularza

- **`src/components/project/ProjectNameField.tsx`** - Pole nazwy projektu
- **`src/components/project/ProjectDescriptionField.tsx`** - Pole opisu z licznikiem znaków
- **`src/components/project/ProjectTechnologiesField.tsx`** - Pole technologii używające `useTechnologyManagement`
- **`src/components/project/ProjectStatusField.tsx`** - Pole statusu z Controller
- **`src/components/project/ProjectUrlField.tsx`** - Reużywalne pole URL (repoUrl, demoUrl, previewUrl)

## Zmodyfikowane Pliki

### 1. `src/lib/utils/error.utils.ts`

- **Zmiana**: Dodano `details?: string[]` do interfejsu `ApiError`
- **Zmiana**: `parseApiError()` teraz obsługuje `details` z odpowiedzi API
- **Typ**: `errorData as AuthErrorResponseDto & { details?: string[] }`

### 2. `src/lib/hooks/useProjectForm.ts`

- **Usunięto**: Bezpośrednie wywołania `fetch()`
- **Dodano**: Import `projectService` i `ErrorType`, `ApiError`
- **Zmiana**: `onSubmit` używa teraz `projectService.createProject()`
- **Zmiana**: Obsługa błędów przez sprawdzanie `error.type === ErrorType.AUTHENTICATION`
- **Zmiana**: Mapowanie błędów walidacji przez `apiError.details`

### 3. `src/lib/hooks/useProjectEditForm.ts`

- **Usunięto**: Bezpośrednie wywołania `fetch()` i `fetchProjectQueryCount()`
- **Dodano**: Import `projectService` i `ErrorType`, `ApiError`
- **Zmiana**: `useEffect` używa `projectService.getProject()` z `requestId` dla anulowania
- **Zmiana**: `useEffect` używa `projectService.getProjectQueryCount()`
- **Zmiana**: Cleanup w `useEffect` wywołuje `projectService.cancelRequest(requestId)`
- **Zmiana**: `onSubmit` używa `projectService.updateProject()`
- **Zmiana**: Obsługa błędów przez `ErrorType` enum

### 4. `src/lib/hooks/useAIGeneration.ts`

- **Usunięto**: Bezpośrednie wywołanie `fetch()` w `generateAI()`
- **Dodano**: Import `projectService` i `ErrorType`, `ApiError`
- **Zmiana**: `generateAI()` używa `projectService.generateAI()` z `requestId`
- **Zmiana**: `closeInput()` wywołuje `projectService.cancelRequest()` przed lokalnym abortem
- **Zmiana**: Obsługa błędów przez `ErrorType` enum z obsługą status codes (403, 404, 429, 500)

### 5. `src/components/ProjectForm.tsx`

- **Zmiana strukturalna**: Redukcja z 410 linii do ~172 linii
- **Usunięto**: Wszystkie pola formularza (przeniesione do osobnych komponentów)
- **Usunięto**: Logika zarządzania technologiami (przeniesiona do hooka)
- **Usunięto**: `watch()`, `setValue`, lokalny stan technologii
- **Dodano**: Import `FormProvider`, `useFormContext` z react-hook-form
- **Dodano**: Import wszystkich komponentów pól z `@/components/project/`
- **Dodano**: Komponent wewnętrzny `ProjectFormFields` używający `useFormContext()`
- **Zmiana**: `ProjectForm` opakowuje formularz w `<FormProvider {...form}>`
- **Zmiana**: Wszystkie pola używają teraz komponentów zamiast inline JSX

## Wzorce i Konwencje

### React Hook Form

- **FormProvider**: Używany w `ProjectForm` do udostępnienia kontekstu formularza
- **useFormContext**: Używany we wszystkich komponentach pól zamiast prop drilling
- **useWatch**: Używany zamiast `watch()` dla lepszej wydajności (tylko re-renderuje gdy zmienia się konkretne pole)
- **Controller**: Używany tylko w `ProjectStatusField` dla Select component

### Obsługa Błędów API

- Wszystkie błędy API są typu `ApiError` z polami:
  - `type: ErrorType` (AUTHENTICATION, AUTHORIZATION, VALIDATION, SERVER, NETWORK)
  - `message: string`
  - `statusCode?: number`
  - `details?: string[]` (dla błędów walidacji)
- Mapowanie błędów walidacji przez `mapServerErrorsToForm()` z `useProjectForm.ts`
- Przekierowania: 401 → `/login`, 403/404 → `/projects`

### Anulowanie Żądań

- `ProjectService` zarządza `AbortController` przez `Map<string, AbortController>`
- Każde żądanie może mieć `requestId` dla anulowania
- `useProjectEditForm` używa `requestId = "fetch-project-${projectId}"`
- `useAIGeneration` używa `requestId = "ai-generate-${projectId}"`
- Cleanup w `useEffect` wywołuje `projectService.cancelRequest()`

## Potencjalne Problemy i Obszary do Sprawdzenia

### 1. Testy Jednostkowe

- **Plik**: `tests/unit/lib/hooks/useProjectForm.test.tsx`
- **Problem**: Testy mogą używać mocków `fetch()` które nie działają z `ProjectService`
- **Rozwiązanie**: Zmockować `projectService` zamiast `fetch()`

### 2. TypeScript Typy

- Wszystkie komponenty pól używają `ProjectFormData = CreateProjectFormData | UpdateProjectFormData`
- `useFormContext<ProjectFormData>()` musi być używany konsekwentnie
- Sprawdzić czy wszystkie pola są dostępne w obu typach formularza

### 3. FormProvider Context

- `ProjectFormFields` musi być wewnątrz `<FormProvider>`
- Wszystkie komponenty pól wymagają `useFormContext()` - brak kontekstu spowoduje błąd
- `useAIGeneration` w `ProjectFormFields` otrzymuje `form` z `useFormContext()`

### 4. useWatch vs watch()

- `useWatch` jest hookiem i musi być używany w komponencie React
- Nie może być używany poza komponentem lub w callbackach
- Sprawdzić czy wszystkie użycia są poprawne

### 5. ProjectService Singleton

- `projectService` jest eksportowany jako singleton: `export const projectService = new ProjectService()`
- Wszystkie hooki używają tego samego instancji
- `abortControllers` Map jest współdzielona między wszystkimi żądaniami

### 6. Error Handling Flow

- `ProjectService.request()` rzuca `ApiError` (nie zwraca Response)
- Hooki muszą catchować błędy i sprawdzać `error.type`
- `mapServerErrorsToForm()` wymaga `error.details` array

### 7. Transformacja Danych

- `transformFormData()` z `useProjectForm.ts` jest używana przed wysłaniem do API
- Funkcja trimuje stringi i filtruje puste wartości
- Używana w obu hookach (`useProjectForm`, `useProjectEditForm`)

## Zależności i Importy

### Nowe Importy w Hookach

```typescript
import { projectService } from "@/lib/services/project.service";
import { ErrorType, type ApiError } from "@/lib/utils/error.utils";
```

### Nowe Importy w Komponentach

```typescript
import { FormProvider, useFormContext } from "react-hook-form";
import { useWatch } from "react-hook-form";
import { useTechnologyManagement } from "@/lib/hooks/useTechnologyManagement";
```

## Struktura Komponentów

### Przed Refaktoryzacją

```
ProjectForm (410 linii)
├── Wszystkie pola inline
├── watch() dla wszystkich pól
├── Lokalny stan technologii
└── Bezpośrednie wywołania fetch()
```

### Po Refaktoryzacji

```
ProjectForm (172 linie)
├── FormProvider wrapper
└── ProjectFormFields
    ├── ProjectNameField (useFormContext)
    ├── ProjectDescriptionField (useFormContext, useWatch)
    ├── ProjectTechnologiesField (useFormContext, useTechnologyManagement)
    ├── AISection (useAIGeneration z form z context)
    ├── ProjectStatusField (useFormContext, Controller)
    └── ProjectUrlField × 3 (useFormContext, useWatch)
```

## Kluczowe Punkty do Naprawy Błędów

1. **Sprawdzić czy wszystkie testy mockują `projectService` zamiast `fetch()`**
2. **Sprawdzić czy `useFormContext()` jest używany tylko wewnątrz `<FormProvider>`**
3. **Sprawdzić czy `useWatch` jest używany tylko w komponentach React (nie w callbackach)**
4. **Sprawdzić czy wszystkie błędy API są typu `ApiError` z właściwymi polami**
5. **Sprawdzić czy `requestId` jest unikalny dla każdego żądania**
6. **Sprawdzić czy cleanup w `useEffect` poprawnie anuluje żądania**
7. **Sprawdzić czy `mapServerErrorsToForm()` otrzymuje `details` array z błędów**

## Przykłady Użycia

### Przed (useProjectForm)

```typescript
const response = await fetch("/api/projects", { method: "POST", ... });
if (!response.ok) { /* handle error */ }
```

### Po (useProjectForm)

```typescript
try {
  await projectService.createProject(projectData);
} catch (error) {
  if (error && typeof error === "object" && "type" in error) {
    const apiError = error as ApiError;
    if (apiError.type === ErrorType.AUTHENTICATION) {
      window.location.href = "/login";
    }
    if (apiError.details) {
      mapServerErrorsToForm(apiError.details, form);
    }
  }
}
```

### Przed (ProjectForm)

```typescript
const watchedTechnologies = watch("technologies");
const [newTechnology, setNewTechnology] = useState("");
// ... inline JSX dla wszystkich pól
```

### Po (ProjectForm)

```typescript
<FormProvider {...form}>
  <form>
    <ProjectNameField />
    <ProjectTechnologiesField />
    {/* ... */}
  </form>
</FormProvider>
```

## Checklist Naprawy Błędów

- [ ] Wszystkie testy używają mocków `projectService`
- [ ] Wszystkie komponenty pól są wewnątrz `<FormProvider>`
- [ ] `useWatch` nie jest używany w callbackach lub poza komponentami
- [ ] Wszystkie błędy API są typu `ApiError`
- [ ] `requestId` są unikalne i używane w cleanup
- [ ] `mapServerErrorsToForm()` otrzymuje `details` array
- [ ] TypeScript typy są poprawne dla wszystkich komponentów
- [ ] Brak prop drilling - wszystko przez `useFormContext()`
- [ ] `useTechnologyManagement` poprawnie używa `form` z context
