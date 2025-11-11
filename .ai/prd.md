# Dokument wymagań produktu (PRD) - Portfol.io (MVP)

## 1. Przegląd produktu

Portfol.io to aplikacja internetowa w wersji MVP (Minimum Viable Product), zaprojektowana w celu ułatwienia deweloperom zarządzania portfolio swoich projektów. Aplikacja pozwala na centralne przechowywanie informacji o projektach, takich jak opisy, wykorzystane technologie oraz linki do demonstracji i repozytoriów. Kluczową funkcją jest integracja z AI, która na podstawie dostarczonych linków do plików z publicznych repozytoriów GitHub potrafi automatycznie wygenerować opis projektu i zidentyfikować stack technologiczny, znacznie przyspieszając proces dokumentacji.

Celem MVP jest dostarczenie podstawowego, ale w pełni funkcjonalnego narzędzia, które rozwiązuje główny problem deweloperów - brak jednego miejsca do efektywnego zarządzania i prezentowania swoich prac.

## 2. Problem użytkownika

Deweloperzy często pracują nad wieloma projektami jednocześnie, co prowadzi do rozproszenia informacji i utrudnia ich spójne przedstawienie potencjalnym pracodawcom, klientom czy społeczności. Ręczne tworzenie i aktualizowanie portfolio jest czasochłonne i często zaniedbywane. Brakuje narzędzia, które w prosty i zautomatyzowany sposób pomogłoby zebrać kluczowe dane o projekcie i zaprezentować je w przejrzystej formie. Portfol.io ma na celu rozwiązanie tego problemu, oferując scentralizowaną platformę z inteligentnym asystentem do generowania treści.

## 3. Wymagania funkcjonalne

### 3.1. System uwierzytelniania i kont użytkowników

- Użytkownicy mogą rejestrować się w systemie wyłącznie za pomocą adresu e-mail i hasła.
- Obowiązuje polityka silnych haseł (szczegóły do zdefiniowania na etapie implementacji).
- Logowanie odbywa się przy użyciu zarejestrowanego adresu e-mail i hasła.
- Konto użytkownika jest automatycznie blokowane po 5 nieudanych próbach logowania. Odblokowanie w MVP wymaga kontaktu z administratorem.
- Użytkownik ma możliwość trwałego usunięcia swojego konta i wszystkich powiązanych z nim danych.

### 3.2. Zarządzanie projektami (CRUD)

- Użytkownicy mogą tworzyć, odczytywać, aktualizować i usuwać projekty w ramach swojego portfolio.
- Każdy projekt musi zawierać następujące pola:
  - Nazwa (pole wymagane)
  - Opis (pole wymagane)
  - Technologie (pole wymagane)
  - Status (pole wymagane, wybór z predefiniowanej listy: `planowanie`, `w trakcie`, `MVP completed`, `zakończony`)
  - Podgląd (opcjonalna ikona/obraz)
  - Link do repozytorium (pole opcjonalne)
  - Link do dema (pole opcjonalne)
- Strona główna po zalogowaniu wyświetla listę wszystkich projektów użytkownika.
- Dla nowych użytkowników, którzy nie mają jeszcze żadnych projektów, wyświetlany jest specjalny widok ("empty state") z wyraźnym wezwaniem do działania (call to action) zachęcającym do dodania pierwszego projektu.

### 3.3. Integracja z AI

- Użytkownik może zainicjować analizę AI dla konkretnego projektu za pomocą dedykowanego przycisku w formularzu edycji projektu.
- Proces polega na dostarczeniu przez użytkownika listy bezpośrednich linków do surowej zawartości plików (`raw file links`) z publicznych repozytoriów.
- AI analizuje dostarczone pliki w celu wygenerowania propozycji opisu projektu oraz listy zidentyfikowanych technologii.
- Wygenerowane przez AI treści są wstawiane do odpowiednich pól formularza i mogą być dowolnie edytowane przez użytkownika przed zapisaniem.
- Wprowadzone są następujące ograniczenia użycia AI:
  - Do 5 zapytań AI na jeden projekt.
  - Do 8 plików na jedno zapytanie.
  - Maksymalny rozmiar pojedynczego pliku to 100 KB.

### 3.4. Strona profilu użytkownika

- Każdy użytkownik posiada stronę profilu, na której wyświetlana jest lista jego projektów.

## 4. Granice produktu

### 4.1. Co wchodzi w zakres MVP

- Pełna funkcjonalność CRUD dla projektów w ramach konta jednego użytkownika.
- System rejestracji i logowania oparty na e-mailu i haśle, wraz z mechanizmem blokady konta.
- Integracja z AI do generowania opisów i technologii na podstawie linków do plików.
- Widok "empty state" dla nowych użytkowników.
- Możliwość usunięcia konta przez użytkownika.

### 4.2. Co NIE wchodzi w zakres MVP

- Funkcje społecznościowe.
- Przechowywanie całych repozytoriów projektów lub ich klonowanie.
- Hostowanie aplikacji (projektów) użytkowników.
- Panel administracyjny do zarządzania użytkownikami (np. odblokowywania kont).
- Zaawansowane funkcje, takie jak filtrowanie czy sortowanie projektów po statusie.
- Publiczne profile użytkowników.
- Integracja z innymi metodami logowania (np. OAuth z GitHub, Google).

### 4.3. Nierozwiązane kwestie

- Wybór konkretnego modelu AI do analizy plików. Decyzja ta zostanie podjęta po analizie technicznej i kosztowej dostępnych opcji.
- Szczegółowy proces odblokowywania konta. Należy zdefiniować kanał komunikacji z administratorem (np. dedykowany adres e-mail, formularz kontaktowy).

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i zarządzanie kontem

---

- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji przy użyciu mojego adresu e-mail i bezpiecznego hasła, aby móc zacząć zarządzać swoimi projektami.
- Kryteria akceptacji:
  1. Formularz rejestracji zawiera pola na adres e-mail, hasło i potwierdzenie hasła.
  2. Walidacja po stronie klienta i serwera sprawdza, czy e-mail ma poprawny format.
  3. System sprawdza, czy hasło spełnia wymogi bezpieczeństwa (np. minimalna długość, złożoność).
  4. Po pomyślnej rejestracji jestem automatycznie zalogowany i przekierowany na stronę główną.
  5. Jeśli spróbuję użyć adresu e-mail, który już istnieje w systemie, otrzymam stosowny komunikat o błędzie.

---

- ID: US-002
- Tytuł: Logowanie do aplikacji
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, aby uzyskać dostęp do mojego portfolio projektów.
- Kryteria akceptacji:
  1. Strona logowania zawiera pola na adres e-mail i hasło.
  2. Po poprawnym wprowadzeniu danych jestem zalogowany i przekierowany na moją listę projektów.
  3. Jeśli podam nieprawidłowy e-mail lub hasło, zobaczę czytelny komunikat o błędzie.
  4. System zlicza nieudane próby logowania dla mojego konta.

---

- ID: US-003
- Tytuł: Blokada konta po nieudanych próbach logowania
- Opis: Jako użytkownik, w przypadku 5-krotnego podania błędnego hasła, moje konto powinno zostać zablokowane ze względów bezpieczeństwa.
- Kryteria akceptacji:
  1. Po piątej nieudanej próbie logowania z rzędu, dostęp do konta zostaje zablokowany.
  2. Po zablokowaniu konta, wyświetlany jest komunikat informujący o blokadzie i konieczności kontaktu z administratorem.
  3. Próba logowania na zablokowane konto (nawet z poprawnym hasłem) kończy się niepowodzeniem i wyświetleniem odpowiedniego komunikatu.

---

- ID: US-004
- Tytuł: Usunięcie konta
- Opis: Jako użytkownik, chcę mieć możliwość trwałego usunięcia mojego konta i wszystkich moich danych z aplikacji.
- Kryteria akceptacji:
  1. W ustawieniach konta znajduje się opcja "Usuń konto".
  2. Po kliknięciu opcji usunięcia, wyświetlane jest okno dialogowe z wyraźnym ostrzeżeniem, że operacja jest nieodwracalna i spowoduje usunięcie wszystkich projektów.
  3. Muszę potwierdzić chęć usunięcia konta (np. poprzez ponowne kliknięcie przycisku w oknie dialogowym).
  4. Po potwierdzeniu, moje konto i wszystkie powiązane z nim dane (projekty) są trwale usuwane z bazy danych.
  5. Zostaję wylogowany i przekierowany na stronę główną aplikacji.

### 5.2. Zarządzanie projektami

---

- ID: US-005
- Tytuł: Widok dla nowego użytkownika bez projektów
- Opis: Jako nowy, zalogowany użytkownik, który nie dodał jeszcze żadnego projektu, chcę zobaczyć zachętę do dodania pierwszego projektu, aby łatwo zrozumieć, jak zacząć korzystać z aplikacji.
- Kryteria akceptacji:
  1. Po pierwszym zalogowaniu, zamiast listy projektów, widzę specjalną sekcję ("empty state").
  2. Sekcja ta zawiera przyjazny komunikat i wyraźny przycisk "Dodaj swój pierwszy projekt".
  3. Kliknięcie przycisku przekierowuje mnie do formularza tworzenia nowego projektu.

---

- ID: US-006
- Tytuł: Tworzenie nowego projektu
- Opis: Jako użytkownik, chcę móc dodać nowy projekt do mojego portfolio, wypełniając formularz z jego kluczowymi informacjami.
- Kryteria akceptacji:
  1. Mogę otworzyć formularz dodawania projektu z poziomu strony głównej.
  2. Formularz zawiera pola: nazwa, opis, technologie, status, link do repozytorium, link do dema oraz pole do przesłania obrazu podglądu.
  3. Pola nazwa, opis, technologie i status są wymagane.
  4. Po pomyślnym zapisaniu formularza, jestem przekierowywany na listę projektów, gdzie widzę nowo dodany element.

---

- ID: US-007
- Tytuł: Przeglądanie listy projektów
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich projektów na stronie głównej, aby mieć szybki przegląd mojego portfolio.
- Kryteria akceptacji:
  1. Na stronie głównej wyświetlana jest lista moich projektów w formie kafelków lub wierszy.
  2. Każdy element na liście wyświetla co najmniej nazwę projektu, technologie i jego status.
  3. Z poziomu listy mam dostęp do opcji edycji i usunięcia każdego projektu.

---

- ID: US-008
- Tytuł: Edycja istniejącego projektu
- Opis: Jako użytkownik, chcę móc edytować informacje o moich istniejących projektach, aby utrzymać je w aktualnym stanie.
- Kryteria akceptacji:
  1. Mogę przejść do trybu edycji dla wybranego projektu z listy.
  2. Formularz edycji jest wstępnie wypełniony aktualnymi danymi projektu.
  3. Mogę zmienić dowolne pole projektu i zapisać zmiany.
  4. Po zapisaniu zmian jestem przekierowywany z powrotem na listę projektów, gdzie widzę zaktualizowane dane.

---

- ID: US-009
- Tytuł: Usuwanie projektu
- Opis: Jako użytkownik, chcę móc usunąć projekt z mojego portfolio, jeśli nie jest już aktualny.
- Kryteria akceptacji:
  1. Przy każdym projekcie na liście znajduje się przycisk "Usuń".
  2. Po kliknięciu przycisku "Usuń" pojawia się okno dialogowe z prośbą o potwierdzenie operacji.
  3. Po potwierdzeniu, projekt jest trwale usuwany z mojego portfolio.
  4. Lista projektów na stronie głównej zostaje odświeżona i usunięty projekt nie jest już na niej widoczny.

### 5.3. Integracja z AI

---

- ID: US-010
- Tytuł: Generowanie opisu i technologii za pomocą AI
- Opis: Jako użytkownik edytujący projekt, chcę skorzystać z funkcji AI, aby automatycznie wygenerować opis i listę technologii na podstawie kodu źródłowego, podając linki do plików w moim repozytorium.
- Kryteria akceptacji:
  1. W formularzu edycji projektu znajduje się przycisk "Generuj z AI" (lub podobny).
  2. Po kliknięciu przycisku pojawia się pole tekstowe, do którego mogę wkleić listę linków do surowej zawartości plików (jeden link na linię).
  3. Po uruchomieniu analizy, przycisk jest nieaktywny, a ja widzę wskaźnik ładowania.
  4. Po zakończeniu analizy, pola "Opis" i "Technologie" w formularzu są wypełniane treścią wygenerowaną przez AI.
  5. Mogę swobodnie edytować wygenerowaną treść przed zapisaniem projektu.
  6. System śledzi liczbę zapytań AI dla każdego projektu.

---

- ID: US-011
- Tytuł: Obsługa limitów zapytań AI
- Opis: Jako użytkownik, jeśli spróbuję użyć funkcji AI więcej niż 5 razy dla jednego projektu, powinienem otrzymać informację o osiągnięciu limitu.
- Kryteria akceptacji:
  1. Gdy liczba zapytań AI dla danego projektu osiągnie 5, przycisk "Generuj z AI" staje się nieaktywny.
  2. Przy nieaktywnym przycisku wyświetlana jest informacja o wykorzystaniu limitu zapytań dla tego projektu.
  3. Próba wysłania szóstego zapytania (np. przez API) jest blokowana przez serwer.
  4. Limity są również egzekwowane dla liczby plików (max 8) i rozmiaru pliku (max 100KB) - w przypadku przekroczenia użytkownik otrzymuje stosowny komunikat błędu przed wysłaniem zapytania.

---

- ID: US-012
- Tytuł: Obsługa błędu domyślnego modelu AI poprzez fallback na alternatywny model
- Opis: Jako użytkownik korzystający z funkcji AI, jeśli domyślny model zwróci błąd (np. niedostępność), chcę aby system automatycznie spróbował alternatywnego modelu, aby zwiększyć szanse na pomyślne wygenerowanie opisu i technologii.
- Kryteria akceptacji:
  1. Po błędzie domyślnego modelu (google/gemini-2.0-flash-exp:free), system sekwencyjnie próbuje modeli: deepseek/deepseek-chat-v3.1:free, openai/gpt-oss-20b:free.
  2. Każda próba fallbacku jest logowana, ale nie zwiększa licznika zapytań AI, chyba że nastąpi sukces.
  3. Jeśli fallback się powiedzie, pola formularza są wypełnione wygenerowaną treścią.
  4. Użytkownik nie musi ręcznie interweniować; proces jest automatyczny z wskaźnikiem ładowania.

---

- ID: US-014
- Tytuł: Obsługa wyczerpania wszystkich modeli fallback
- Opis: Jako użytkownik, jeśli wszystkie modele fallback zawiodą, chcę otrzymać czytelny komunikat o tymczasowej niedostępności serwisu AI, bez utraty postępu w edycji projektu.
- Kryteria akceptacji:
  1. Po wyczerpaniu sekwencji modeli, wyświetlany jest komunikat błędu: "Serwis AI jest chwilowo niedostępny, spróbuj później."
  2. Formularz edycji projektu pozostaje otwarty z możliwością ręcznego uzupełnienia pól.
  3. Licznik zapytań AI nie jest zwiększany w przypadku niepowodzenia wszystkich prób.
  4. Błąd jest logowany po stronie serwera dla monitoringu.

## 6. Metryki sukcesu

Kryteria sukcesu dla wersji MVP będą mierzone okresowo za pomocą ręcznie uruchamianych zapytań SQL do bazy danych przez zespół projektowy.

- Kryterium 1: 100% zarejestrowanych użytkowników posiada co najmniej jeden projekt na swoim koncie.
  - Sposób pomiaru: Zapytanie SQL sprawdzające stosunek liczby użytkowników z co najmniej jednym projektem do całkowitej liczby użytkowników.

- Kryterium 2: 75% użytkowników uzupełnia informacje o stacku technologicznym i opisie projektu za pomocą AI.
  - Sposób pomiaru: Zapytanie SQL sprawdzające, jaki procent użytkowników, którzy dodali projekt, użyło generowania treści AI.
