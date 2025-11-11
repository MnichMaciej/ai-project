---
import Layout from '../layouts/Layout.astro'; // Przykładowy, nie zmieniaj
---

# Architektura modułu rejestracji, logowania i zarządzania kontem użytkownika

Poniżej przedstawiam szczegółową, opisową specyfikację techniczną architektury modułu autentykacji i zarządzania kontem użytkownika, opartą na wymaganiach z dokumentu PRD (US-001: Rejestracja nowego użytkownika, US-002: Logowanie do aplikacji, US-003: Blokada konta po nieudanych próbach logowania, US-004: Usunięcie konta). Specyfikacja uwzględnia stack technologiczny z tech-stack.md (Astro 5 z React 19 dla interaktywności, TypeScript 5, Supabase Auth dla backendu i autentykacji, Tailwind 4 oraz Shadcn/ui dla UI). Architektura zachowuje zgodność z istniejącym działaniem aplikacji, w tym konfiguracją Astro (output: server, adapter: node standalone), strukturą projektu (src/pages, src/components, src/lib, src/db) oraz praktykami kodowania (camelCase dla nazw, walidacja błędów, guard clauses).

Specyfikacja jest podzielona na wskazane sekcje, z naciskiem na komponenty, moduły, serwisy i kontrakty (interfejsy/types). Nie zawiera implementacji kodu, lecz opisuje strukturę i interakcje.

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

Moduł autentykacji wprowadza zmiany w warstwie frontendowej, dzieląc odpowiedzialność między statycznymi stronami Astro (renderowane server-side dla SEO i wydajności) a dynamicznymi komponentami React (dla interaktywności formularzy). Layouty Astro obsługują stany autentykacji (auth/non-auth), a komponenty React integrują się z Supabase SDK via serwisy w src/lib. Nawigacja opiera się na Astro's router, z przekierowaniami po akcjach (np. po logowaniu do /projects).

### Zmiany w warstwie frontendowej:

- **Strony Astro (src/pages):**
  - Nowa strona `/auth/register.astro`: Statyczna struktura z layoutem non-auth (bez nagłówka portfolio). Zawiera slot dla komponentu React `RegisterForm`. Renderowana server-side, ale z hydratacją React dla formularza. Obsługuje initial load i przekierowanie po sukcesie (do /projects).
  - Nowa strona `/auth/login.astro`: Analogicznie do register, z slotem dla `LoginForm`. Dodatkowe sprawdzenie server-side (via Supabase session) – jeśli użytkownik zalogowany, przekierowanie do /projects.
  - Rozszerzenie istniejącej `/projects.astro` (strona główna): Dodanie middleware check (src/middleware/index.ts) do weryfikacji sesji Supabase. W trybie non-auth: przekierowanie do /auth/login. W trybie auth: renderowanie listy projektów z komponentem `ProjectList`. Dla empty state (US-005, powiązane): slot dla `EmptyState` komponentu.
  - Nowa strona `/profile.astro`: Rozszerzenie dla US-004 (usunięcie konta). W trybie auth: slot dla komponentu `ProfileSettings` z opcją usunięcia. Server-side check sesji; non-auth: przekierowanie do login.
  - Layouty (src/layouts): Rozszerzenie `Layout.astro` o prop `isAuthenticated` (z Supabase session). W trybie non-auth: uproszczony layout z linkami do register/login. W trybie auth: pełny layout z linkami do projects/profile/logout. Nowy `AuthLayout.astro` dla stron /auth/\* – bez dostępu do portfolio. Rozszerzenie komponentu `Header.astro` (topbar) o warunkowe renderowanie nawigacji: dla zalogowanych użytkowników – linki do Projekty, Dodaj projekt, Profil oraz przycisk Wyloguj (form POST do /api/auth/logout z ARIA dla accessibility); dla niezalogowanych – linki do Zaloguj i Zarejestruj. Integracja z ThemeToggle zachowana.

- **Middleware (src/middleware/index.ts):** Nowy middleware do automatycznego przekierowywania niezalogowanych użytkowników do /auth/login na chronionych routach (np. /projects, /profile). Używa server-side Supabase client do pobierania sesji i ustawiania locals.user. Jeśli brak sesji na chronionym routie – response 302 z Location: /auth/login. Obsługa błędów z early return.

- **Komponenty client-side (src/components):**
  - Nowy moduł `src/components/auth`: Zawiera React komponenty z Shadcn/ui (np. Input, Button, Card, Alert dla błędów).
    - `RegisterForm.tsx`: Odpowiedzialny za formularz rejestracji (pola: email, password, confirmPassword). Używa React Hook Form dla walidacji client-side + Zod schema. Integracja z serwisem `AuthService` (src/lib/auth.service.ts) do wywołania Supabase signUp. Po sukcesie: automatyczne logowanie i nawigacja (useNavigate z @astrojs/react).
    - `LoginForm.tsx`: Analogicznie, pola: email, password. Wywołuje Supabase signInWithPassword. Licznik nieudanych prób (lokalny state + API check dla blokady).
    - `ProfileSettings.tsx`: Dla US-004 – komponent z przyciskiem "Usuń konto". Wywołuje Supabase deleteUser po potwierdzeniu (Dialog z Shadcn/ui z input potwierdzenia, np. wpisanie 'usuń' lub hasła, ostrzeżenie o nieodwracalności i usunięciu projektów). Po sukcesie: wylogowanie i przekierowanie do root. Obsługa błędów via Toast.
    - `EmptyState.tsx`: Rozszerzenie dla nowych użytkowników (integracja z US-005) – statyczny komponent Astro z CTA do tworzenia projektu.
  - Rozdzielenie odpowiedzialności:
    - Strony Astro: Renderowanie server-side (initial HTML), middleware dla auth guards, integracja z Supabase dla sesji (getSession w onLoad).
    - Komponenty React: Hydratacja po load (islandy Astro), obsługa stanu formularza, walidacja client-side, API calls via fetch lub Supabase client. Nawigacja: useNavigate dla client-side routing, window.location dla server-side po sukcesie.
    - Serwisy (src/lib): `AuthService` – abstrakcja nad Supabase Auth (metody: signUp, signIn, signOut, deleteUser). Kontrakt: TypeScript interface `AuthMethods` z async returns (Promise<User | null>).

### Walidacja i komunikaty błędów:

- Client-side: React Hook Form + Zod (schematy: email format via regex, password min 8 chars + złożoność). Komunikaty: Shadcn/ui Toast/Alert (np. "Nieprawidłowy format e-mail", "Hasło musi mieć co najmniej 8 znaków").
- Server-side sync: Po API call, error handling w serwisach (np. Supabase errors mapped to user-friendly: "E-mail już istnieje" dla US-001, "Nieprawidłowe dane logowania" dla US-002).
- Edge cases: Dla US-003 – po 5 próbach: Alert "Konto zablokowane, skontaktuj się z adminem". Walidacja confirmPassword mismatch. Loading states (Spinner z Shadcn) podczas API calls. Dla usuwania konta: dodatkowe potwierdzenie w dialogu.

### Obsługa scenariuszy:

- Rejestracja (US-001): Form submit → walidacja → Supabase signUp (z weryfikacją emaila wyłączoną) → natychmiastowe utworzenie rekordu w tabeli `users` → utworzenie sesji server-side przez Supabase → frontend otrzymuje user + session → redirect /projects (frontend tylko przekierowuje, sesja jest już aktywna server-side).
- Logowanie (US-002): Submit → check blokady (API) → signIn → redirect /projects. Błąd: increment counter (session storage + server).
- Blokada (US-003): Server-side check w login endpoint (jeśli locked: error response). Licznik reset po sukcesie.
- Usunięcie (US-004): Dialog confirm (z input potwierdzenia) → Supabase deleteUser → signOut → redirect root. Ostrzeżenie: "Operacja nieodwracalna, usunie wszystkie projekty". Dostępne via /profile z linkiem w Header.

## 2. LOGIKA BACKENDOWA

Backend opiera się na Supabase (PostgreSQL + Auth), z endpointami API w src/pages/api (Astro server endpoints). Modele danych rozszerzają istniejące (src/types.ts, src/db). Walidacja via Zod, obsługa błędów z custom error types (src/lib/errors.ts). Renderowanie server-side w Astro dostosowane do config (output: server, node adapter) – endpoints zwracają JSON lub redirect.

### Struktura endpointów API i modeli danych:

- **Modele (src/types.ts i src/db/supabase.ts):**
  - Rozszerzenie `User` type (z Supabase): Dodaj camelCase pola: `failedLoginAttempts: number`, `isLocked: boolean`, `lockedAt: Date | null`. DTOs: `RegisterDto` (email: string, password: string), `LoginDto` (email: string, password: string), `DeleteAccountDto` (confirm: boolean).
  - Tabela Supabase: Użyj auth.users (wbudowana) + custom tabela `users` (id: uuid references auth.users.id, failed_login_attempts: int default 0, locked: bool default false). Endpoint register tworzy rekord w tabeli `users` natychmiast po signUp(). Triggers: Auto-lock po 5 attempts (edge function lub RLS policy).

- **Endpointy (src/pages/api/auth):**
  - `POST /api/auth/register`: Przyjmuje RegisterDto. Walidacja Zod. Tworzy user via Supabase auth.signUp (z weryfikacją emaila wyłączoną dla MVP). Natychmiast po signUp() tworzy rekord w tabeli `users` (nie `user_profiles`) z domyślnymi wartościami (failed_login_attempts: 0, locked: false). Zwraca { user: User, session: Session } - pełna sesja jest tworzona server-side przez Supabase, co umożliwia automatyczne logowanie. Frontend otrzymuje sesję i tylko przekierowuje do /projects. Obsługa błędów: mapowanie Supabase error "email already exists" na komunikat "Adres e-mail jest już zajęty" (tylko ten błąd jest obsługiwany szczegółowo). Integracja z US-001 (check email uniqueness).
  - `POST /api/auth/login`: LoginDto. Sprawdza lock (query users table). Jeśli nie locked: auth.signInWithPassword, reset attempts. Zwraca session lub error (US-002/003).
  - `POST /api/auth/logout`: Brak body. Wywołuje auth.signOut server-side (z weryfikacją sesji). Zwraca { success: true } i czyści cookies/sesję. Integracja z przyciskiem w Header.
  - `DELETE /api/auth/account`: Weryfikuje sesję (getSession). Usuwa user via auth.admin.deleteUser, kasuje profile/projekty (cascade delete). US-004. Wymaga confirm w DTO (np. hasło lub token).
  - `GET /api/auth/session`: Zwraca current session (dla middleware i Header).

### Mechanizm walidacji danych wejściowych:

- Zod schemas w endpointach (np. zodRegisterSchema.parse(req.body)). Guard clauses: Jeśli invalid – early return z HttpError (status 400, message: string).
- Server-side: Supabase RLS (Row Level Security) dla tabel – tylko owner może czytać/update users.

### Obsługa wyjątków:

- Custom module `src/lib/errors.ts`: Klasy jak `AuthError` extends Error (props: code: string, message: string, userMessage: string). Mapping Supabase errors: tylko "email already exists" → userMessage: "Adres e-mail jest już zajęty". Inne błędy zwracane w postaci ogólnej.
- W endpointach: try-catch → log error (console lub Supabase logs) → return JsonResponse z { error: userMessage }. Rate limiting dla login (Supabase built-in).

### Aktualizacja renderowania server-side:

- W astro.config.mjs (output: server): Endpoints jako async functions z getSession() z @supabase/supabase-js. Dla stron jak /projects.astro: onLoad() → if (!session) redirect('/auth/login'). Integracja z middleware (src/middleware/index.ts): locals.user = await getSession(). Integracja z existing redirects ("/" → "/projects").

## 3. SYSTEM AUTENTYKACJI

Supabase Auth jest centralnym elementem, integrującym się z Astro via @supabase/supabase-js client (src/db/supabase-client.ts: createClient z env vars). Konfiguracja: Supabase project URL + anon key w .env. Brak OAuth (zgodne z MVP – tylko email/password).

### Integracja z Astro:

- **Klient-side (React components):** Użyj Supabase client w `AuthService` (src/lib/auth.service.ts). Metody: signUp({email, password}), signInWithPassword, signOut(), deleteUser (admin client z service role key). Kontrakt: Interface `SupabaseAuth` z returns Promise<AuthResponse>.
- **Server-side (Astro pages/api):** Supabase server client (createServerClient w src/lib/supabase-server.ts). W middleware: Sprawdź session, ustaw locals.authenticated = !!session?.user. Dla Header: server-side getSession do conditional render.
- **Sesje i security:** Supabase JWT tokens (auto-refresh via client). Dla US-003: Custom hook w auth.users_metadata lub edge function do lock. Odzyskiwanie hasła: Użyj Supabase resetPasswordForEmail (nowy endpoint /api/auth/reset-password, z email input w LoginForm – rozszerzenie US-002).
- **Weryfikacja emaila:** Wyłączona dla MVP - użytkownicy są automatycznie aktywowani po rejestracji. Konfiguracja Supabase: email confirmation disabled.
- **Wylogowywanie:** Globalny przycisk w Header.astro (wywołuje POST /api/auth/logout lub client-side service.signOut()). Po wylogowaniu: redirect do /auth/login lub root.
- **Bezpieczeństwo:** Hashes w Supabase (built-in). Polityka haseł: Zod walidacja (min length 8, uppercase, number). Dla delete (US-004): Wymagaj confirm password w DTO i dialog z potwierdzeniem w ProfileSettings.

### Kluczowe moduły i serwisy:

- `src/db/supabase-client.ts`: Inicjalizacja client (browser) i server.
- `src/lib/auth.service.ts`: Abstrakcja (metody dla US-001-004, w tym signOut i deleteUser z error handling).
- `src/middleware/index.ts`: Guards dla protected routes z auto-redirect.
- Kontrakty: `AuthUser` type (extends Supabase User), `AuthResponse` (user, session, error?).

Ta architektura zapewnia skalowalność (Supabase BaaS), bezpieczeństwo (RLS, JWT) i zgodność z MVP (brak dodatkowych features jak OAuth). Po implementacji, przetestować z linterami (ESLint/TS) i error handling.
