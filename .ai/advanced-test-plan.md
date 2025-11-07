# Szczegółowy Plan Testów Jednostkowych

## Wprowadzenie

Plan testów jednostkowych dla aplikacji AI Project Manager. Aplikacja umożliwia zarządzanie projektami programistycznymi z funkcją automatycznego generowania opisów i technologii poprzez analizę kodu źródłowego z GitHub.

## Zakres Testów

Testy jednostkowe obejmują:
- **Serwisy backendowe** (AIService, ProjectService)
- **Hooki React** (useProjectForm, useAIGeneration, useProjects)
- **Komponenty React** (AIGenerateButton, ProjectForm, LoginForm)
- **Walidatory i schematy** (project.validators, formularze)
- **Middleware i API endpoints**

---

## Scenariusze Testowe

### 1. AIService - Generowanie Opisu Projektu

**Nazwa scenariusza:** `AIService_should_generate_project_description_from_github_files`
- **Logika biznesowa:** Pobieranie plików z GitHub, wywołanie API OpenRouter, parsowanie odpowiedzi JSON i walidacja struktury danych
- **Komponent:** `src/lib/ai.service.ts`

**Nazwa scenariusza:** `AIService_should_handle_github_fetch_errors`
- **Logika biznesowa:** Obsługa błędów pobierania plików (nieprawidłowe URL, przekroczenie limitu rozmiaru, błędy HTTP)
- **Komponent:** `src/lib/ai.service.ts`

**Nazwa scenariusza:** `AIService_should_validate_file_size_limits`
- **Logika biznesowa:** Walidacja rozmiaru plików (maksymalnie 100KB na plik)
- **Komponent:** `src/lib/ai.service.ts`

**Nazwa scenariusza:** `AIService_should_parse_ai_response_json`
- **Logika biznesowa:** Parsowanie odpowiedzi AI, obsługa różnych formatów (czysty JSON, markdown z kodem)
- **Komponent:** `src/lib/ai.service.ts`

### 2. ProjectService - Operacje na Projektach

**Nazwa scenariusza:** `ProjectService_should_fetch_user_projects_with_pagination`
- **Logika biznesowa:** Pobieranie projektów użytkownika z paginacją, sortowaniem i filtrowaniem
- **Komponent:** `src/lib/project.service.ts`

**Nazwa scenariusza:** `ProjectService_should_create_project_with_validation`
- **Logika biznesowa:** Tworzenie nowego projektu, mapowanie DTO na kolumny bazy danych, walidacja statusu
- **Komponent:** `src/lib/project.service.ts`

**Nazwa scenariusza:** `ProjectService_should_update_project_with_ownership_check`
- **Logika biznesowa:** Aktualizacja projektu z weryfikacją własności, mapowanie pól camelCase/snake_case
- **Komponent:** `src/lib/project.service.ts`

**Nazwa scenariusza:** `ProjectService_should_delete_project_with_ownership_verification`
- **Logika biznesowa:** Usuwanie projektu z weryfikacją własności i kaskadowym usuwaniem zapytań AI
- **Komponent:** `src/lib/project.service.ts`

**Nazwa scenariusza:** `ProjectService_should_handle_database_errors_gracefully`
- **Logika biznesowa:** Obsługa błędów bazy danych, logowanie i zwracanie odpowiednich komunikatów błędów
- **Komponent:** `src/lib/project.service.ts`

### 3. Walidatory Projektów

**Nazwa scenariusza:** `projectValidators_should_validate_create_project_schema`
- **Logika biznesowa:** Walidacja schematu tworzenia projektu (wymagane pola, długości stringów, enum status)
- **Komponent:** `src/lib/validators/project.validators.ts`

**Nazwa scenariusza:** `projectValidators_should_validate_ai_generation_request`
- **Logika biznesowa:** Walidacja linków do plików GitHub (maksymalnie 8 linków, format URL)
- **Komponent:** `src/lib/validators/project.validators.ts`

**Nazwa scenariusza:** `projectValidators_should_validate_update_project_partial_data`
- **Logika biznesowa:** Walidacja częściowej aktualizacji projektu (co najmniej jedno pole wymagane)
- **Komponent:** `src/lib/validators/project.validators.ts`

### 4. Hook useProjectForm - Zarządzanie Formularzem Projektu

**Nazwa scenariusza:** `useProjectForm_should_validate_form_data_on_change`
- **Logika biznesowa:** Walidacja w czasie rzeczywistym, obsługa błędów serwera, transformacja danych
- **Komponent:** `src/lib/hooks/useProjectForm.ts`

**Nazwa scenariusza:** `useProjectForm_should_submit_project_creation_request`
- **Logika biznesowa:** Wysyłanie żądania POST, obsługa odpowiedzi sukces/błąd, przekierowanie
- **Komponent:** `src/lib/hooks/useProjectForm.ts`

**Nazwa scenariusza:** `useProjectForm_should_handle_network_errors`
- **Logika biznesowa:** Obsługa błędów sieciowych, timeoutów, błędów parsowania JSON
- **Komponent:** `src/lib/hooks/useProjectForm.ts`

**Nazwa scenariusza:** `useProjectForm_should_transform_form_data_for_api`
- **Logika biznesowa:** Trimowanie stringów, filtrowanie pustych technologii, konwersja URL
- **Komponent:** `src/lib/hooks/useProjectForm.ts`

### 5. Hook useAIGeneration - Generowanie AI

**Nazwa scenariusza:** `useAIGeneration_should_validate_github_raw_urls`
- **Logika biznesowa:** Walidacja formatu URL GitHub raw, maksymalna liczba plików (8), obsługa błędów
- **Komponent:** `src/lib/hooks/useAIGeneration.ts`

**Nazwa scenariusza:** `useAIGeneration_should_enforce_query_limits`
- **Logika biznesowa:** Sprawdzanie limitu zapytań (maksymalnie 5 na projekt), blokada przycisku
- **Komponent:** `src/lib/hooks/useAIGeneration.ts`

**Nazwa scenariusza:** `useAIGeneration_should_handle_ai_generation_request`
- **Logika biznesowa:** Wysyłanie żądania POST, aktualizacja formularza danymi AI, obsługa błędów HTTP
- **Komponent:** `src/lib/hooks/useAIGeneration.ts`

**Nazwa scenariusza:** `useAIGeneration_should_manage_loading_states`
- **Logika biznesowa:** Zarządzanie stanami ładowania, anulowanie żądań, cleanup przy odmontowaniu
- **Komponent:** `src/lib/hooks/useAIGeneration.ts`

**Nazwa scenariusza:** `useAIGeneration_should_update_form_with_ai_data`
- **Logika biznesowa:** Aktualizacja pól formularza danymi z AI, wywołanie callbacków, walidacja
- **Komponent:** `src/lib/hooks/useAIGeneration.ts`

### 6. Hook useProjects - Pobieranie Projektów

**Nazwa scenariusza:** `useProjects_should_fetch_projects_with_pagination`
- **Logika biznesowa:** Pobieranie listy projektów z parametrami paginacji, obsługa ładowania i błędów
- **Komponent:** `src/lib/hooks/useProjects.ts`

**Nazwa scenariusza:** `useProjects_should_handle_loading_and_error_states`
- **Logika biznesowa:** Zarządzanie stanami ładowania, obsługa błędów API, cache'owanie danych
- **Komponent:** `src/lib/hooks/useProjects.ts`

### 7. Komponent AIGenerateButton

**Nazwa scenariusza:** `AIGenerateButton_should_render_with_correct_props`
- **Logika biznesowa:** Renderowanie przycisku z ikoną, obsługa props disabled i onClick
- **Komponent:** `src/components/ai/AIGenerateButton.tsx`

**Nazwa scenariusza:** `AIGenerateButton_should_show_tooltip_when_disabled`
- **Logika biznesowa:** Wyświetlanie tooltip z informacją o limicie zapytań gdy przycisk jest wyłączony
- **Komponent:** `src/components/ai/AIGenerateButton.tsx`

**Nazwa scenariusza:** `AIGenerateButton_should_have_proper_accessibility`
- **Logika biznesowa:** Atrybuty ARIA, etykiety dostępności, obsługa klawiatury
- **Komponent:** `src/components/ai/AIGenerateButton.tsx`

### 8. Komponent ProjectForm

**Nazwa scenariusza:** `ProjectForm_should_integrate_with_useProjectForm_hook`
- **Logika biznesowa:** Integracja z hookiem formularza, obsługa walidacji, wyświetlanie błędów
- **Komponent:** `src/components/ProjectForm.tsx`

**Nazwa scenariusza:** `ProjectForm_should_render_all_form_fields`
- **Logika biznesowa:** Renderowanie pól tekstowych, select dla statusu, tagi technologii, URL inputs
- **Komponent:** `src/components/ProjectForm.tsx`

**Nazwa scenariusza:** `ProjectForm_should_handle_ai_generation_integration`
- **Logika biznesowa:** Integracja z komponentem AI, obsługa generowania opisu i technologii
- **Komponent:** `src/components/ProjectForm.tsx`

### 9. Komponent LoginForm

**Nazwa scenariusza:** `LoginForm_should_validate_credentials`
- **Logika biznesowa:** Walidacja email i hasła, wyświetlanie błędów walidacji
- **Komponent:** `src/components/auth/LoginForm.tsx`

**Nazwa scenariusza:** `LoginForm_should_handle_authentication_request`
- **Logika biznesowa:** Wysyłanie żądania logowania, obsługa odpowiedzi sukces/błąd, przekierowanie
- **Komponent:** `src/components/auth/LoginForm.tsx`

**Nazwa scenariusza:** `LoginForm_should_track_failed_attempts`
- **Logika biznesowa:** Śledzenie nieudanych prób logowania, wyświetlanie licznika
- **Komponent:** `src/components/auth/LoginForm.tsx`

### 10. Middleware - Autentyfikacja

**Nazwa scenariusza:** `middleware_should_verify_user_session`
- **Logika biznesowa:** Sprawdzanie sesji użytkownika, weryfikacja tokenów JWT, przekierowanie dla niezalogowanych
- **Komponent:** `src/middleware/index.ts`

**Nazwa scenariusza:** `middleware_should_handle_public_routes`
- **Logika biznesowa:** Pomijanie weryfikacji dla publicznych ścieżek (login, register, reset-password)
- **Komponent:** `src/middleware/index.ts`

### 11. API Endpoints - Projekty

**Nazwa scenariusza:** `projects_api_should_handle_get_request_with_auth`
- **Logika biznesowa:** Weryfikacja autentyfikacji, pobieranie projektów użytkownika, obsługa parametrów query
- **Komponent:** `src/pages/api/projects.ts`

**Nazwa scenariusza:** `projects_api_should_validate_create_project_payload`
- **Logika biznesowa:** Walidacja ciała żądania POST, tworzenie projektu, obsługa błędów walidacji
- **Komponent:** `src/pages/api/projects.ts`

**Nazwa scenariusza:** `projects_api_should_handle_update_project_request`
- **Logika biznesowa:** Weryfikacja własności projektu, walidacja danych aktualizacji, obsługa błędów
- **Komponent:** `src/pages/api/projects/[id].ts`

### 12. API Endpoints - AI Generation

**Nazwa scenariusza:** `ai_generate_api_should_validate_request_payload`
- **Logika biznesowa:** Walidacja linków GitHub, sprawdzanie limitu zapytań, weryfikacja własności projektu
- **Komponent:** `src/pages/api/projects/[id]/ai-generate.ts`

**Nazwa scenariusza:** `ai_generate_api_should_integrate_with_ai_service`
- **Logika biznesowa:** Wywołanie AIService, obsługa odpowiedzi AI, aktualizacja licznika zapytań
- **Komponent:** `src/pages/api/projects/[id]/ai-generate.ts`

**Nazwa scenariusza:** `ai_generate_api_should_handle_rate_limiting`
- **Logika biznesowa:** Sprawdzanie i egzekwowanie limitów zapytań, zwracanie odpowiednich kodów HTTP
- **Komponent:** `src/pages/api/projects/[id]/ai-generate.ts`

### 13. API Endpoints - Autentyfikacja

**Nazwa scenariusza:** `auth_login_api_should_validate_credentials`
- **Logika biznesowa:** Walidacja danych logowania, sprawdzanie rate limiting, tworzenie sesji
- **Komponent:** `src/pages/api/auth/login.ts`

**Nazwa scenariusza:** `auth_register_api_should_create_user_account`
- **Logika biznesowa:** Walidacja danych rejestracji, tworzenie użytkownika, automatyczne logowanie
- **Komponent:** `src/pages/api/auth/register.ts`

**Nazwa scenariusza:** `auth_reset_password_api_should_send_recovery_email`
- **Logika biznesowa:** Weryfikacja email, generowanie tokenu recovery, wysyłanie email
- **Komponent:** `src/pages/api/auth/reset-password.ts`

---

## Priorytety Testowania

### Wysoki Priorytet (Krytyczna Funkcjonalność)
- Walidacja danych wejściowych
- Autentyfikacja i autoryzacja
- Operacje CRUD na projektach
- Generowanie AI z obsługą błędów
- Obsługa limitów i rate limiting

### Średni Priorytet (Funkcjonalność Użytkownika)
- Zarządzanie stanem formularzy
- Obsługa błędów UI
- Walidacja w czasie rzeczywistym
- Komponenty interfejsu użytkownika

### Niski Priorytet (Optymalizacja)
- Wydajność komponentów
- Edge cases w walidacji
- Szczegółowe scenariusze błędów

---

## Metryki Jakości

- **Pokrycie kodu:** Min. 80% dla serwisów i hooków, 70% dla komponentów
- **Liczba testów:** Min. 3-5 scenariuszy na główny komponent biznesowy
- **Czas wykonania:** Maks. 30 sekund dla pełnego zestawu testów
- **Maintainability:** Testy powinny być czytelne i łatwe w utrzymaniu

---

## Narzędzia Testowe

- **Vitest** - framework testów jednostkowych
- **React Testing Library** - testowanie komponentów React
- **jsdom** - środowisko DOM dla testów
- **@testing-library/jest-dom** - rozszerzenia matcherów
- **msw** - mockowanie API calls (jeśli potrzebne)

---

## Strategia Mockowania

- **Serwisy zewnętrzne:** Mockowanie OpenRouter API, Supabase client
- **Hooki:** Mockowanie custom hooks w testach komponentów
- **API calls:** Mockowanie fetch dla testów hooków
- **Baza danych:** Mockowanie operacji Supabase w testach serwisów
