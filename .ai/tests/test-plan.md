<analiza_projektu>
Po przeanalizowaniu kodu projektu Portfol.io, mogę zidentyfikować następujące kluczowe aspekty wpływające na strategię testowania:
Kluczowe komponenty projektu:
System uwierzytelniania - obsługuje rejestrację, logowanie, blokadę konta po 5 nieudanych próbach
Zarządzanie projektami - pełne operacje CRUD dla projektów z wymaganymi polami (nazwa, opis, technologie, status)
Integracja z AI - analiza plików GitHub przez OpenRouter.ai do generowania opisów i list technologii
Interfejs użytkownika - aplikacja Astro z komponentami React dla interaktywności
Backend Supabase - PostgreSQL z politykami RLS i autentyfikacją
Specyfika stosu technologicznego:
Astro 5 - wymaga testowania SSR/SSG, hydration i routingu
React 19 - testowanie komponentów, hooków i stanów
TypeScript 5 - walidacja typów i bezpieczeństwo typów
Tailwind 4 - testowanie responsywności i wizualnej regresji
Supabase - testowanie polityk RLS, zapytań API i bezpieczeństwa danych
OpenRouter.ai - testowanie integracji zewnętrznego API z mockowaniem
Priorytety testowe:
Funkcje bezpieczeństwa - autentyfikacja, blokada konta, polityka haseł
Funkcjonalność AI - generowanie treści, limity zapytań, obsługa błędów
Operacje CRUD - tworzenie, odczyt, aktualizacja, usuwanie projektów
Walidacja danych - sprawdzanie poprawności danych wejściowych
Obsługa błędów - komunikaty błędów i przypadki brzegowe
Obszary wysokiego ryzyka:
Zawodność API AI - zależność od zewnętrznego serwisu OpenRouter.ai
Bezpieczeństwo autentyfikacji - blokada konta, polityka haseł, podatności
Integralność danych - polityka RLS, kaskadowe usuwanie, więzy integralności
Ograniczenia AI - limity plików (8), rozmiaru (100KB), zapytań (5 na projekt)
Kompatybilność przeglądarek - nowoczesny stack technologiczny
Wydajność - duże pliki kodu, obciążenie API AI
</analiza_projektu>
<plan_testów>
Kompleksowy Plan Testów - Portfol.io

1. Wprowadzenie i cele testowania
   1.1 Cel projektu testowania
   Celem niniejszego planu testów jest zapewnienie wysokiej jakości aplikacji Portfol.io poprzez systematyczne testowanie wszystkich kluczowych funkcjonalności, identyfikację potencjalnych defektów oraz weryfikację zgodności z wymaganiami biznesowymi i technicznymi.
   1.2 Zakres projektu
   Portfol.io to aplikacja webowa MVP umożliwiająca deweloperom zarządzanie portfolio projektów z automatycznym generowaniem treści za pomocą sztucznej inteligencji.
   1.3 Kryteria sukcesu testowania
   Wszystkie krytyczne ścieżki użytkownika działają bez błędów
   Funkcje bezpieczeństwa są niezawodne
   Integracja z AI działa stabilnie
   Aplikacja jest responsywna i dostępna
2. Zakres testów
   2.1 Funkcjonalności w zakresie
   Rejestracja i logowanie użytkowników
   Zarządzanie projektami (CRUD)
   Integracja z AI OpenRouter
   Obsługa błędów i walidacja danych
   Interfejs użytkownika i responsywność
   2.2 Funkcjonalności poza zakresem
   Testy wydajności obciążeniowej
   Testy penetracyjne bezpieczeństwa
   Testy kompatybilności urządzeń mobilnych
   Testy internacjonalizacji
3. Typy testów do przeprowadzenia
   3.1 Testy jednostkowe (Unit Tests)
   Komponenty React: Testowanie hooków, stanów i logiki komponentów
   Serwisy: AIService, ProjectService, walidatory
   Narzędzia: Utility functions, helpers
   Typy TypeScript: Walidacja schematów Zod
   3.2 Testy integracyjne (Integration Tests)
   API endpoints: Testowanie endpointów Astro API
   Baza danych: Operacje CRUD z Supabase
   Integracja AI: OpenRouter API z mockowaniem
   Autentyfikacja: Przepływ logowania/rejestracji
   3.3 Testy end-to-end (E2E)
   Przepływy użytkownika: Scenariusze zdefiniowane w user stories
   Nawigacja: Routing między stronami
   Formularze: Walidacja i submit danych
   3.4 Testy komponentów UI
   Komponenty Shadcn/ui: Testowanie dostępności i interakcji
   Responsywność: Różne rozmiary ekranów
   Dostępność: Zgodność z WCAG
   3.5 Testy bezpieczeństwa
   Autentyfikacja: Blokada konta, polityka haseł
   Autoryzacja: Polityki RLS Supabase
   Walidacja danych: Injection, XSS, CSRF
4. Scenariusze testowe dla kluczowych funkcjonalności
   4.1 Scenariusze autentyfikacji
   US-001: Rejestracja nowego użytkownika
   Wprowadzenie prawidłowych danych rejestracji
   Próba rejestracji z istniejącym emailem
   Walidacja hasła zgodnie z polityką bezpieczeństwa
   US-002: Logowanie do aplikacji
   Poprawne logowanie
   Nieprawidłowy email/hasło
   Blokada po 5 nieudanych próbach
   US-003: Blokada konta
   Symulacja 5 nieudanych logowań
   Próba logowania na zablokowane konto
   Komunikaty błędów i instrukcje odblokowania
   4.2 Scenariusze zarządzania projektami
   US-005: Widok dla nowego użytkownika
   Wyświetlanie empty state
   Funkcjonalność przycisku CTA
   US-006: Tworzenie nowego projektu
   Wypełnienie wszystkich wymaganych pól
   Wysyłanie formularza z niekompletnymi danymi
   Walidacja formatów URL
   US-007: Przeglądanie listy projektów
   Wyświetlanie projektów zalogowanego użytkownika
   Filtrowanie i sortowanie (jeśli zaimplementowane)
   US-008: Edycja projektu
   Wstępne wypełnianie formularza
   Modyfikacja wszystkich pól
   Zapis zmian
   US-009: Usuwanie projektu
   Potwierdzenie usunięcia
   Kaskadowe usuwanie zapytań AI
   4.3 Scenariusze integracji AI
   US-010: Generowanie treści AI
   Poprawne linki GitHub raw files
   Analiza i wypełnienie pól formularza
   Edycja wygenerowanych treści
   US-011: Obsługa limitów AI
   Przekroczenie limitu 5 zapytań na projekt
   Próba przesłania >8 plików
   Pliki >100KB
5. Środowisko testowe
   5.1 Środowisko deweloperskie
   Node.js 22.14.0
   Supabase lokalny
   Baza testowa z danymi fikcyjnymi
   5.2 Środowisko staging
   Infrastruktura podobna do produkcyjnej
   Dane testowe odizolowane od produkcji
   Monitoring błędów
   5.3 Narzędzia deweloperskie
   Browser DevTools
   React Developer Tools
   Supabase Dashboard
6. Narzędzia do testowania
   6.1 Testy jednostkowe i integracyjne
   { "framework": "Vitest", "testing-library": "@testing-library/react", "mocking": "msw", "coverage": "v8"}
   6.2 Testy E2E
   { "framework": "Playwright", "browsers": ["chromium", "firefox", "webkit"], "ci": "GitHub Actions"}
   6.3 Testy UI i wizualne
   { "component-testing": "Storybook", "visual-regression": "Chromatic", "accessibility": "axe-core"}
   6.4 Testy API
   { "api-testing": "Postman/Newman", "load-testing": "k6", "contract-testing": "Pact"}
7. Harmonogram testów
   7.1 Faza 1: Przygotowanie (Tydzień 1)
   Konfiguracja środowiska testowego
   Implementacja podstawowych testów jednostkowych
   Utworzenie testów dymnych
   7.2 Faza 2: Rozwój testów (Tygodnie 2-3)
   Testy integracyjne dla API
   Testy komponentów React
   Testy E2E dla krytycznych ścieżek
   7.3 Faza 3: Testowanie funkcjonalne (Tydzień 4)
   Pełne testy E2E wszystkich user stories
   Testy bezpieczeństwa
   Testy wydajności
   7.4 Faza 4: Regresja i akceptacja (Tydzień 5)
   Testy regresyjne
   Testy akceptacyjne przez PO
   Przygotowanie do wdrożenia
8. Kryteria akceptacji testów
   8.1 Kryteria przejścia testów
   Testy jednostkowe: Min. 80% pokrycia kodu
   Testy integracyjne: Wszystkie API endpoints przetestowane
   Testy E2E: Wszystkie user stories zaimplementowane
   Testy bezpieczeństwa: Brak krytycznych podatności
   8.2 Definicja zakończenia
   Wszystkie testy automatyczne przechodzą
   Krytyczne defekty (<severity 2) naprawione
   Metryki sukcesu MVP osiągnięte
9. Role i odpowiedzialności w procesie testowania
   9.1 Inżynier QA (prowadzący)
   Tworzenie i utrzymanie planu testów
   Implementacja automatycznych testów
   Raportowanie defektów
   Współpraca z zespołem deweloperskim
   9.2 Developerzy
   Implementacja funkcji z uwzględnieniem testowalności
   Pisanie testów jednostkowych dla własnego kodu
   Naprawa defektów zidentyfikowanych w testach
   9.3 Product Owner
   Definiowanie kryteriów akceptacji
   Priorytetyzacja defektów
   Weryfikacja funkcjonalności biznesowej
10. Procedury raportowania błędów
    10.1 Klasyfikacja błędów
    Krytyczny (S1): Blokuje kluczowe funkcjonalności
    Wysoki (S2): Istotny wpływ na UX, bezpieczeństwo
    Średni (S3): Drobne błędy, edge cases
    Niski (S4): Usprawnienia, kosmetyka
    10.2 Format zgłoszenia błędu
    **Tytuł:** [Krótki opis błędu]**Środowisko:** [dev/staging/prod]**Kroki reprodukcji:**1. 2. 3. **Oczekiwane zachowanie:\*\***Aktualne zachowanie:\***\*Dodatkowe informacje:**- Zrzuty ekranu- Logi błędów- Informacje o przeglądarce/urządzeniu
    10.3 Workflow zarządzania defektami
    Identyfikacja i zgłoszenie błędu
    Priorytetyzacja przez PO
    Naprawa przez developera
    Weryfikacja przez QA
    Zamknięcie lub retest
    Data utworzenia: Listopad 2025
    Wersja: 1.0
    Autor: Inżynier QA
    Zatwierdzony przez: Product Owner
    </plan_testów>
