# 🚀 CI/CD Pipeline Setup - Portfol.io

## ✅ Completion Summary

Scenariusz GitHub Actions został pomyślnie skonfigurowany i zoptymalizowany na podstawie tech stacku oraz dostępnych narzędzi.

---

## 📁 Utworzone Pliki

### Workflow

- **`.github/workflows/master.yaml`** - Główny scenariusz CI/CD (165 linii)
  - Uruchamiany: manualnie (workflow_dispatch), push do master, PR do master
  - 5 zadań (jobs): Setup, Build, Unit Tests, E2E Tests, Summary

### Composite Actions (Reusable Steps)

- **`.github/actions/setup-environment/action.yml`** - Setup Node.js i zależności
- **`.github/actions/lint-code/action.yml`** - Walidacja kodu (ESLint + Prettier)

### Dokumentacja

- **`.github/workflows/README.md`** - Kompletny opis workflow
- **`.github/actions/README.md`** - Dokumentacja composite actions
- **`.github/CI_CD_SETUP.md`** - Ten plik (overview)

---

## 🎯 Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Master Branch Update / Manual Run           │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────▼────────────┐
        │ Setup & Validate      │ (10 min)
        │ • Checkout            │
        │ • Node.js v22.14.0    │
        │ • npm ci               │
        │ • ESLint              │
        └──────────┬────────────┘
                   │
        ┌──────────┴─────────────────┬────────────────┐
        │                            │                │
  ┌─────▼──────────────┐  ┌─────────▼──────────┐  ┌──▼──────────────────┐
  │ Build Production   │  │ Unit Tests (Vitest)│  │ E2E Tests (optional)│
  │ (15 min)           │  │ (15 min)           │  │ (waits for build)   │
  │ • Build dist/      │  │ • Run tests        │  │ (20 min)            │
  │ • Upload artifacts │  │ • Coverage report  │  │ • Playwright        │
  └─────┬──────────────┘  │ • Codecov upload   │  │ • Upload report     │
        │                 └────────────────────┘  └────────────────────┘
        │                         │                      │
        └─────────────────────────┼──────────────────────┘
                                  │
                        ┌─────────▼─────────┐
                        │ Summary           │
                        │ (5 min)           │
                        │ Final Status      │
                        └───────────────────┘
```

---

## 🔧 Konfiguracja

### Node.js

- **Wersja**: 22.14.0 (z `.nvmrc`)
- **Package Manager**: npm
- **Instalacja**: `npm ci` (clean install)

### Akcje GitHub (Latest Major Versions)

| Akcja                       | Wersja | Zastosowanie        |
| --------------------------- | ------ | ------------------- |
| `actions/checkout`          | v5     | Pobranie kodu       |
| `actions/setup-node`        | v6     | Setup Node.js       |
| `actions/upload-artifact`   | v5     | Upload artefaktów   |
| `actions/download-artifact` | v6     | Download artefaktów |
| `codecov/codecov-action`    | v5     | Integracja Codecov  |

### Zmienne Środowiskowe

```yaml
NODE_ENV: test        # Setup, Unit Tests, E2E Tests
NODE_ENV: production  # Build Production
```

---

## 🚀 Uruchamianie Pipeline

### 1️⃣ Manualnie

1. Przejdź do GitHub → Actions
2. Wybierz `CI/CD Pipeline - Master`
3. Kliknij `Run workflow`
4. Opcjonalnie: Wybierz branch (default: master)
5. Kliknij `Run workflow`

### 2️⃣ Automatycznie - Push do Master

```bash
git push origin master
# Pipeline uruchomi się automatycznie
```

### 3️⃣ Automatycznie - Pull Request

```bash
git push origin feature-branch
# Otwórz PR do master
# Pipeline uruchomi się dla verification
```

---

## 📊 Jobs Workflow

### 1. **Setup & Validate** ✅

**Timeout**: 10 minut | **Environment**: test

```
✓ Checkout repository
✓ Setup Node.js 22.14.0
✓ Install dependencies (npm ci)
✓ Run ESLint validation
```

**Cel**: Wczesnа walidacja kodu i środowiska

---

### 2. **Build Production** 🏗️

**Timeout**: 15 minut | **Environment**: production | **Zależy od**: Setup

```
✓ Checkout repository
✓ Setup Node.js 22.14.0
✓ Install dependencies (npm ci)
✓ Build application (npm run build)
✓ Upload build artifacts (dist/)
```

**Cel**: Weryfikacja, że build produkcyjny działa
**Artefakty**: `dist/` - zachowane przez 1 dzień

---

### 3. **Unit Tests** 🧪

**Timeout**: 15 minut | **Environment**: test | **Zależy od**: Setup

```
✓ Checkout repository
✓ Setup Node.js 22.14.0
✓ Install dependencies (npm ci)
✓ Run unit tests (Vitest)
✓ Generate coverage report
✓ Upload to Codecov (fail_ci_if_error: false)
```

**Cel**: Potwierdzenie, że testy jednostkowe przechodzą
**Coverage**: Automatycznie wysyłany do Codecov

---

### 4. **E2E Tests** 🎭

**Timeout**: 20 minut | **Environment**: test | **Zależy od**: Build

```
✓ Checkout repository
✓ Setup Node.js 22.14.0
✓ Install dependencies (npm ci)
✓ Download build artifacts (dist/)
✓ Install Playwright browsers
✓ Run E2E tests (Playwright)
✓ Upload Playwright report
```

**Cel**: Weryfikacja end-to-end functionality
**Raporty**: Playwright report - zachowany przez 14 dni

---

### 5. **Summary** 📊

**Timeout**: 5 minut | **Zależy od**: Wszystkich jobów

```
✓ Check if all previous jobs succeeded
✓ Display final pipeline status
✓ Fail if any job failed
```

**Cel**: Ostateczny status i podsumowanie

---

## ⚡ Optimizacje Performance

| Optymizacja             | Opis                                      | Wpływ                           |
| ----------------------- | ----------------------------------------- | ------------------------------- |
| **npm ci**              | Clean install zamiast npm install         | Szybsze, bardziej stabilne      |
| **Cache**               | NPM cache między runami                   | Unikanie powtórnego pobrania    |
| **Parallel Jobs**       | Setup, Tests, Build działają równocześnie | ~50% szybsze wykonanie          |
| **Artifact Passing**    | Build artifacts między jobami             | Unikanie rebuildu               |
| **Timeouts**            | Każdy job ma limit czasu                  | Wyłapanie zawieszonych procesów |
| **Concurrency Control** | Tylko jeden run na branch                 | Oszczędzanie zasobów            |

---

## 🔐 Secrets & Environment Variables

### Wymagane Secrets (do konfiguracji w GitHub)

```
CODECOV_TOKEN - Token do Codecov (jeśli private repo)
```

### Opcjonalne Environment Variables

```
- API_KEY_OPENROUTER
- SUPABASE_URL
- SUPABASE_ANON_KEY
# Dodaj w Settings → Secrets and variables → Actions
```

---

## 🐛 Troubleshooting

### Setup job fails

**Przyczyna**: `.nvmrc` zawiera nie-istniejącą wersję
**Rozwiązanie**: Sprawdź Node.js version w `.nvmrc`

### Build fails with missing dependencies

**Przyczyna**: `package.json` zawiera błędy
**Rozwiązanie**: Uruchom lokalnie `npm ci` i sprawdź błędy

### E2E tests timeout

**Przyczyna**: Playwright browsers nie zainstalowały się
**Rozwiązanie**: Sprawdź czy `npx playwright install --with-deps` przeszło

### Coverage upload fails

**Przyczyna**: Codecov API issue
**Rozwiązanie**: Nie blokuje pipeline (`fail_ci_if_error: false`)

---

## 📈 Monitoring

### GitHub UI

- Actions tab → Przejrzyj logi
- Artifact download dla raportów
- Workflow runs history

### Codecov

- codecov.io → Repository dashboard
- Coverage trend charts
- Per-file coverage details

### Playwright

- Download report z Actions
- Open HTML report w przeglądarce
- Screenshots z failed tests

---

## 🎓 Stack Tecniczny

### Tech Stack Projektu

- **Frontend**: Astro 5, React 19, TypeScript 5
- **Styling**: Tailwind 4, Shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **AI Integration**: OpenRouter API

### CI/CD Tools

- **Platform**: GitHub Actions
- **Testing**: Vitest (unit) + Playwright (E2E)
- **Code Quality**: ESLint + Prettier
- **Coverage**: Codecov

### Workflow Features

- 🔄 Auto-trigger na push/PR
- 🎮 Manual workflow dispatch
- 📦 Artifact management
- 📊 Coverage tracking
- 🎭 E2E test reports
- ⚡ Concurrent job execution
- 🔐 Environment isolation

---

## 📚 Dodatkowe Zasoby

### Dokumentacja

- `.github/workflows/README.md` - Szczegóły workflow
- `.github/actions/README.md` - Dokumentacja composite actions

### Polecenia Lokalne

```bash
npm run lint              # ESLint check
npm run lint:fix          # ESLint auto-fix
npm run format            # Prettier format
npm run test:unit         # Unit tests
npm run test:unit:watch   # Unit tests (watch mode)
npm run test:e2e          # E2E tests
npm run test:e2e:debug    # E2E tests (debug mode)
npm run build             # Production build
npm run dev               # Development server
```

### Linki

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Codecov](https://codecov.io/)

---

## ✨ Next Steps

1. **Konfiguracja Secrets**

   ```
   GitHub → Settings → Secrets and variables → Actions
   ```

2. **Test Pipeline**

   ```
   GitHub → Actions → Run workflow (manual)
   ```

3. **Monitorowanie**

   ```
   GitHub → Actions → View runs
   Codecov.io → Repository dashboard
   ```

4. **Customizacja** (opcjonalnie)
   - Dodaj więcej composite actions
   - Integruj deployment steps
   - Dodaj notifications (Slack, Teams)

---

**Status**: ✅ Gotowy do użytku  
**Ostatnia aktualizacja**: Listopad 2024  
**Wersja Konfiguracji**: 1.0
