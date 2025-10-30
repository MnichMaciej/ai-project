# Architektura UI dla Portfol.io

## 1. Przegląd struktury UI

Architektura interfejsu użytkownika dla Portfol.io opiera się na minimalistycznym, responsywnym designie z wykorzystaniem komponentów Shadcn/ui i Tailwind CSS. Struktura obejmuje widoki związane z uwierzytelnianiem, zarządzaniem projektami oraz integracją z AI, zapewniając płynne przepływy użytkownika. Główny nacisk położono na prostotę nawigacji, obsługę stanów pustych, walidację formularzy oraz komunikaty błędów, z uwzględnieniem dostępności WCAG AA i bezpieczeństwa poprzez warunkowe renderowanie elementów. Widoki są zorganizowane wokół routing Astro z komponentami React, integrując się bezpośrednio z endpointami API dla operacji CRUD i generowania treści AI.

## 2. Lista widoków

### Widok logowania i rejestracji

- **Ścieżka widoku**: /login, /register (lub modale na stronie głównej)
- **Główny cel**: Umożliwienie użytkownikom rejestracji nowego konta lub logowania do istniejącego za pomocą e-maila i hasła, z obsługą blokady po nieudanych próbach.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami e-mail, hasło (i potwierdzenie hasła dla rejestracji), komunikaty błędów (np. nieudane logowanie, blokada konta), linki do przełączania między logowaniem a rejestracją.
- **Kluczowe komponenty widoku**: Formularz z walidacją, przyciski akcji, modale potwierdzeń błędów.
- **UX, dostępność i względy bezpieczeństwa**: Płynne przejście po sukcesie (auto-logowanie i przekierowanie), ARIA labels dla pól formularza, focus management; ukrywanie haseł, walidacja client-side przed API, komunikaty o blokadzie z instrukcją kontaktu z administratorem.

### Widok strony głównej (lista projektów)

- **Ścieżka widoku**: /
- **Główny cel**: Wyświetlenie listy projektów użytkownika z opcją dostępu do edycji lub usunięcia, obsługa empty state dla nowych użytkowników.
- **Kluczowe informacje do wyświetlenia**: Kafelki lub lista projektów z nazwą, technologiami, statusem, podglądem (jeśli dostępny); empty state z wezwaniem do dodania pierwszego projektu.
- **Kluczowe komponenty widoku**: Grid responsywny, badge'e statusów, przyciski edycji/usunięcia, sekcja empty state z CTA.
- **UX, dostępność i względy bezpieczeństwa**: Sortowanie i paginacja opcjonalna, kontrast kolorów badge'ów; ARIA dla nawigacji klawiaturą, warunkowe wyświetlanie akcji tylko dla właściciela (sprawdzane via API).

### Widok tworzenia projektu

- **Ścieżka widoku**: /projects/new
- **Główny cel**: Umożliwienie dodania nowego projektu poprzez wypełnienie formularza z wymaganymi polami.
- **Kluczowe informacje do wyświetlenia**: Formularz z polami: nazwa, opis, technologie (lista), status (wybór), repoUrl, demoUrl, previewUrl (link zewnętrzny).
- **Kluczowe komponenty widoku**: Formularz z walidacją, przycisk zapisu, input dla linków zewnętrznych.
- **UX, dostępność i względy bezpieczeństwa**: Walidacja wymaganych pól, podgląd zmian; focus traps w formularzu, walidacja URL-i client-side, ochrona przed nieautoryzowanym dostępem.

### Widok edycji projektu

- **Ścieżka widoku**: /projects/:id/edit
- **Główny cel**: Edycja istniejącego projektu, w tym integracja z AI do generowania opisu i technologii.
- **Kluczowe informacje do wyświetlenia**: Wypełniony formularz z aktualnymi danymi, przycisk AI z inputem dla linków plików, progress indicator podczas generowania, aktualizacja pól po sukcesie.
- **Kluczowe komponenty widoku**: Formularz edycji, przycisk AI otwierający textarea dla fileLinks, modale błędów (limity AI), badge limitu zapytań.
- **UX, dostępność i względy bezpieczeństwa**: Inline edycja z optimistic updates, walidacja limitów (5 zapytań, 8 plików, 100KB); ARIA live regions dla błędów, blokada przycisku AI po limicie, sprawdzenie własności projektu.

### Widok profilu użytkownika

- **Ścieżka widoku**: /profile
- **Główny cel**: Wyświetlenie listy projektów w kontekście profilu z opcjami zarządzania kontem, w tym usuwaniem.
- **Kluczowe informacje do wyświetlenia**: Lista projektów podobna do strony głównej, sekcja ustawień z opcją usunięcia konta.
- **Kluczowe komponenty widoku**: Lista projektów, modal potwierdzenia usunięcia konta/projektu.
- **UX, dostępność i względy bezpieczeństwa**: CTA do edycji, ostrzeżenie przed usunięciem; semantyczne nagłówki, destructive buttons z potwierdzeniem, kasowanie danych po usunięciu.

## 3. Mapa podróży użytkownika

Podstawowy przepływ dla nowego użytkownika:

1. Wejście na stronę główną → przekierowanie do rejestracji (jeśli nie zalogowany).
2. Rejestracja → walidacja formularza → sukces: auto-logowanie i przekierowanie do strony głównej z empty state.
3. Empty state → kliknięcie CTA "Dodaj pierwszy projekt" → widok tworzenia projektu → wypełnienie formularza → zapis via POST /api/projects → powrót do listy z nowym projektem.

Dla zalogowanego użytkownika:

1. Strona główna → przegląd listy projektów.
2. Wybór projektu → edycja → wypełnienie/aktualizacja pól → opcjonalnie AI: input fileLinks (walidacja limitów) → POST /api/projects/{id}/ai-generate → aktualizacja pól → zapis via PATCH /api/projects/{id}.
3. Usunięcie: kliknięcie przycisku → modal potwierdzenia → DELETE /api/projects/{id} → odświeżenie listy.
4. Zarządzanie kontem: nawigacja do profilu → opcja usunięcia → modal z ostrzeżeniem → potwierdzenie → wylogowanie i przekierowanie.

Obsługa błędów: W każdym kroku, błędy API (np. 401, 429) wyświetlają inline komunikaty z sugestiami (np. "Limit AI osiągnięty").

## 4. Układ i struktura nawigacji

Nawigacja opiera się na routingu Astro z komponentami React. Główny layout zawiera nagłówek z logo, przyciskiem logowania/wylogowania (conditional na podstawie stanu auth) i linkami do strony głównej/profilu. Dla zalogowanych: menu boczne lub navbar z "Projekty", "Profil", "Wyloguj". Przejścia między widokami: bezpośrednie linki lub modale (np. auth jako overlay na stronie głównej). Na mobile: hamburger menu z collapse. Po sukcesie akcji (CRUD/AI): automatyczne przekierowanie z toastem potwierdzenia. Brak głębokiej hierarchii – płaska struktura z 5 głównymi widokami, zapewniająca intuicyjną nawigację bez zbędnych kroków.

## 5. Kluczowe komponenty

- **Formularz projektu**: Reużywalny komponent z react-hook-form i zod dla walidacji pól (wymagane: nazwa, opis, technologie, status; opcjonalne: URL-e), obsługujący zarówno tworzenie jak i edycję.
- **Przycisk AI**: Komponent z toggle do inputu textarea dla fileLinks, progress barem i walidacją limitów, integrujący z endpointem AI.
- **Lista projektów**: Responsywny grid/kafelki z badge'ami statusów (kolory/ikony dla enum: planowanie, w trakcie, MVP completed, zakończony), przyciskami akcji.
- **Modal potwierdzenia**: Shadcn/ui dialog dla usuwania projektu/konta, z ostrzeżeniami i destructive buttonem.
- **Empty State**: Sekcja z ikoną, komunikatem zachęcającym i CTA przyciskiem do tworzenia projektu.
- **Komunikaty błędów**: Inline lub toast notifications mapujące kody API (np. 429 dla limitu AI) na user-friendly wiadomości, z ARIA announcements.
