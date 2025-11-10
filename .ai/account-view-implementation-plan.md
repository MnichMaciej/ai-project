# Plan implementacji widoku Widok profilu użytkownika

## 1. Przegląd

Widok profilu użytkownika (/profile) służy do wyświetlania i zarządzania ustawieniami konta użytkownika, w tym opcji zmiany hasła oraz trwałego usunięcia konta wraz z wszystkimi powiązanymi danymi. Głównym celem jest zapewnienie bezpiecznego i intuicyjnego interfejsu do zarządzania profilem, zgodnego z wymaganiami PRD i user story US-004. Widok integruje się z backendem Supabase i API endpointem DELETE /api/account, wykorzystując komponenty React z Shadcn/ui dla responsywnego designu na desktopie i mobile.

## 2. Routing widoku

Ścieżka: `/profile` – dostępna tylko dla zalogowanych użytkowników. Zabezpieczona middleware'em autentykacji w Astro (`src/middleware/index.ts`). Przekierowanie na stronę logowania, jeśli użytkownik nie jest uwierzytelniony. Na mobile, widok adaptuje się do mniejszych ekranów bez zmian w routingu.

## 3. Struktura komponentów

Hierarchia komponentów:

- `AccountView` (główny komponent widoku, Astro + React island)
  - `ProfileHeader` (nagłówek z danymi użytkownika)
  - `AccountSettings` (sekcja ustawień)
    - `ChangePasswordForm` (formularz zmiany hasła, reużywa i dostosowuje UpdatePasswordForm z auth)
    - `DeleteAccountSection` (sekcja usuwania konta)
      - `DeleteAccountButton` (przycisk wyzwalający modal)
      - `DeleteAccountModal` (modal potwierdzenia, z Shadcn/ui Dialog)

Struktura responsywna: Użyj Tailwind do grid/flex na desktopie i stack na mobile.

## 4. Szczegóły komponentów

### AccountView

- Opis komponentu: Główny kontener widoku, zarządza routingiem wewnętrznym i stanem globalnym (np. loading, errors). Składa się z layoutu z nagłówkiem i sekcją ustawień.
- Główne elementy: `<main>` z semantycznym `<header>` dla profilu, `<section>` dla ustawień; dzieci: ProfileHeader, AccountSettings.
- Obsługiwane interakcje: Nawigacja między sekcjami (tabs na desktopie, accordion na mobile).
- Obsługiwana walidacja: Brak bezpośredniej; deleguje do dzieci.
- Typy: `UserDto` dla danych użytkownika.
- Propsy: `{ user: UserDto | null }`.

### ProfileHeader

- Opis komponentu: Wyświetla podstawowe informacje o użytkowniku (email, data utworzenia). Służy jako potwierdzenie tożsamości przed zmianami.
- Główne elementy: `<h1>` "Twój profil", `<p>` z emailem; ikona użytkownika z Shadcn/ui Avatar.
- Obsługiwane interakcje: Brak; statyczny.
- Obsługiwana walidacja: Brak.
- Typy: `UserDto`.
- Propsy: `{ user: UserDto }`.

### AccountSettings

- Opis komponentu: Kontener dla opcji zarządzania kontem, w tym zmiana hasła i usunięcie. Responsywny: tabs na desktopie, accordion na mobile.
- Główne elementy: `<div class="grid md:grid-cols-2 gap-4">` lub `<Accordion>` z Shadcn/ui; dzieci: ChangePasswordForm, DeleteAccountSection.
- Obsługiwane interakcje: Przełączanie sekcji.
- Obsługiwana walidacja: Deleguje do form.
- Typy: Brak specyficznych.
- Propsy: `{ userId: string }`.

### ChangePasswordForm

- Opis komponentu: Formularz do zmiany hasła, reużywa i dostosowuje komponent UpdatePasswordForm z `src/components/auth/UpdatePasswordForm.tsx` (dodaj pole dla starego hasła, integracja z Supabase auth.updateUser() z weryfikacją starego hasła via API).
- Główne elementy: Pola input dla starego hasła, nowego, potwierdzenia; przycisk submit; error messages; pasek siły hasła z oryginalnego komponentu.
- Obsługiwane interakcje: onSubmit – walidacja i update hasła.
- Obsługiwana walidacja: Hasło min. 8 znaków, złożoność (uppercase, number); potwierdzenie match; walidacja starego hasła via API; walidacja po stronie klienta z Zod.
- Typy: `UpdatePasswordDto` (rozszerzony o oldPassword).
- Propsy: `{ onSuccess: () => void }`.

### DeleteAccountSection

- Opis komponentu: Sekcja z ostrzeżeniem i przyciskiem do usuwania konta. Wyświetla info o konsekwencjach (usunięcie projektów).
- Główne elementy: `<p>` ostrzeżenie, `<Button variant="destructive">` do otwarcia modala.
- Obsługiwane interakcje: onClick – otwiera modal.
- Obsługiwana walidacja: Brak; potwierdzenie w modalu.
- Typy: Brak.
- Propsy: `{ onDelete: () => void }`.

### DeleteAccountModal

- Opis komponentu: Modal potwierdzenia usuwania z ostrzeżeniem i przyciskiem potwierdzenia. Używa Shadcn/ui Dialog.
- Główne elementy: `<DialogContent>` z `<h2>` ostrzeżenie, `<p>` o nieodwracalności, przyciski anuluj/potwierdź (destructive).
- Obsługiwane interakcje: onConfirm – wywołuje API DELETE /api/account, zamyka modal, przekierowuje po sukcesie.
- Obsługiwana walidacja: Potwierdzenie kliknięciem; brak dodatkowych pól.
- Typy: `DeleteAccountResponse`.
- Propsy: `{ isOpen: boolean, onClose: () => void, onConfirm: () => void }`.

## 5. Typy

Wykorzystaj istniejące typy z `src/types.ts`:

- `UserDto`: `{ id: string; createdAt: string; updatedAt: string; email?: string }` – dla danych profilu.
- `UpdatePasswordDto`: `{ password: string; confirmPassword: string }` – dla zmiany hasła (rozszerz o oldPassword: string dla weryfikacji).
- `DeleteAccountResponse`: `{ success: boolean }` – odpowiedź z API usuwania.

Nowe typy ViewModel:

- `AccountViewModel`: `{ user: UserDto | null; isLoading: boolean; error: string | null; isDeleting: boolean }` – stan widoku, pola: user (dane), isLoading (fetching), error (błędy), isDeleting (pending delete).
- `PasswordFormState`: `{ oldPassword: string; newPassword: string; confirmPassword: string; errors: Partial<Record<'oldPassword' | 'newPassword' | 'confirmPassword', string>> }` – dla formularza hasła, z walidacją.

Typy zależne: `ProjectStatus` niepotrzebne tu; użyj `Session` z Supabase dla autentykacji.

## 6. Zarządzanie stanem

Użyj React useState w `AccountView` dla lokalnego stanu: `const [viewModel, setViewModel] = useState<AccountViewModel>({ user: null, isLoading: true, error: null, isDeleting: false })`.

- Fetch danych użytkownika przy mount: useEffect z supabase.auth.getUser().
- Custom hook: `useAccountManagement` – zarządza stanem usuwania i hasła; cel: enkapsulacja logiki API (np. deleteAccount(userId: string): Promise<DeleteAccountResponse>); użycie: w komponentach do onConfirm.
- Na mobile: useMediaQuery hook dla responsywności (Tailwind obsługuje automatycznie).
- Globalny stan: Użyj useAuth z `src/lib/hooks/useAuth.ts` dla sesji.

## 7. Integracja API

Integracja z DELETE /api/account:

- Żądanie: DELETE, bez body; autentykacja via locals.user w middleware.
- Odpowiedź: 200 { success: true } lub błędy (401, 500).
- W `useAccountManagement`: async function deleteAccount() { const res = await fetch('/api/account', { method: 'DELETE' }); if (res.ok) { await supabase.auth.signOut(); redirect('/'); } else { throw new Error('Failed to delete'); } }
- Typy: Request – brak; Response – DeleteAccountResponse.
- Dla zmiany hasła: Użyj supabase.auth.updateUser({ password: newPassword }), z weryfikacją starego hasła via dedykowane API (np. /api/auth/verify-old-password).

## 8. Interakcje użytkownika

- Wyświetlenie profilu: Automatyczne ładowanie danych użytkownika po wejściu; dostęp via menu w Header (dropdown na hover email) lub MobileBottomNav (w menu użytkownika).
- Zmiana hasła: Wypełnij formularz (stare + nowe hasło), submit – walidacja, update, toast sukces/błąd (Shadcn/ui Toast).
- Usunięcie konta: Kliknij przycisk – otwórz modal; przeczytaj ostrzeżenie; kliknij potwierdź – loading, API call, wyloguj i przekieruj na '/'.
- Na mobile: Swipe/accordion do sekcji; touch-friendly buttons (min. 44px); nawigacja via MobileBottomNav menu.
- CTA: "Edytuj hasło" linkuje do formularza; "Usuń konto" z ikoną ostrzeżenia.

## 9. Warunki i walidacja

- Autentykacja: Sprawdź locals.user; jeśli brak – przekieruj (w middleware).
- Hasło: Klient-side Zod schema: min(8), includes uppercase/number; confirm match – disable submit jeśli invalid; error messages pod polami; weryfikacja starego hasła.
- Usuwanie: Tylko dla właściciela (RLS w DB); potwierdzenie modale – uniemożliwia accidental delete.
- Limity: Brak w tym widoku (dotyczy AI); walidacja email/hasło zgodna z PRD (silne hasła).
- Responsywność: Media queries Tailwind – grid na >768px, stack na mobile; ARIA labels dla dostępności; nawigacja dostosowana do desktop (hover) i mobile (tap).

## 10. Obsługa błędów

- 401 Unauthorized: Toast "Sesja wygasła", przekieruj do login.
- 500 Internal Server Error: Toast "Błąd serwera, spróbuj ponownie"; log console.error.
- Walidacja hasła: Wyświetl błędy inline (np. "Hasło zbyt słabe"); błąd starego hasła: "Nieprawidłowe stare hasło".
- Sieciowe błędy: Catch w fetch, pokaż "Sprawdź połączenie".
- Po usunięciu: Jeśli fail – zamknij modal, toast "Nie udało się usunąć konta".
- Edge cases: Brak projektów – nie wpływa; locked account – obsłuż w auth (z PRD).

## 11. Kroki implementacji

1. Utwórz stronę Astro: `src/pages/profile.astro` z React island dla komponentów.
2. Zaimplementuj routing i middleware ochronę w `src/middleware/index.ts`.
3. Stwórz komponenty React w `src/components/account/`: AccountView.tsx, ProfileHeader.tsx, etc., używając Shadcn/ui (Dialog, Button, Input, Accordion).
4. Dostosuj i reużyj UpdatePasswordForm z `src/components/auth/UpdatePasswordForm.tsx` dla ChangePasswordForm, dodając pole oldPassword i walidację.
5. Dodaj typy do `src/types.ts` jeśli nowe (AccountViewModel, rozszerzony UpdatePasswordDto).
6. Zaimplementuj useAccountManagement hook w `src/lib/hooks/`.
7. Integruj API: fetch DELETE w hooku; updateUser dla hasła z weryfikacją.
8. Dodaj walidację Zod w formularzach.
9. Aktualizuj nawigację: W `src/components/Header.astro` dodaj link do /profile w dropdown menu (na hover email); w `src/components/MobileBottomNav.tsx` dodaj opcję "Profil" w menu użytkownika.
10. Styluj z Tailwind: Responsywne klasy (md:grid-cols-2, sm:flex-col).
11. Testuj: Unit (Vitest dla hooków), E2E (Playwright: symuluj delete, sprawdź redirect i nawigację).
12. Reużyj: Input/Toast z auth components; mobile – test na emulatorze.
13. Lint i deploy: Uruchom vitest, eslint; push do Vercel.
