# 🚀 Quick Start - GitHub Actions CI/CD

## ⚡ 5 Minut Setup

### 1. Sprawdź Konfigurację ✅

```bash
# Upewnij się, że wszystkie pliki są na miejscu
ls -la .github/workflows/master.yaml
ls -la .github/actions/
cat .nvmrc   # Node.js version
```

### 2. Skonfiguruj Secrets (opcjonalnie)

GitHub → Settings → Secrets and variables → Actions

```
CODECOV_TOKEN = your_token_here
```

### 3. Uruchom Pipeline

#### Opcja A: Manual (GitHub UI)

```
GitHub → Actions
→ CI/CD Pipeline - Master
→ Run workflow
```

#### Opcja B: Push Master

```bash
git push origin master
# Pipeline uruchomi się automatycznie
```

#### Opcja C: Pull Request

```bash
git checkout -b feature/xyz
git push origin feature/xyz
# Utwórz PR do master
# Pipeline uruchomi się do verification
```

### 4. Monitoruj Status

```
GitHub → Actions → CI/CD Pipeline - Master
```

---

## 📊 Co Pipeline Robi?

| Job              | Czas   | Sprawdzenie          |
| ---------------- | ------ | -------------------- |
| Setup & Validate | 10 min | ESLint ✅            |
| Build Production | 15 min | Build działa ✅      |
| Unit Tests       | 15 min | Vitest przechodzi ✅ |
| E2E Tests        | 20 min | Playwright działa ✅ |
| Summary          | 5 min  | Ostateczny status ✅ |

---

## ✅ Success Criteria

Pipeline przechodzi ✅ jeśli:

- ✓ ESLint bez błędów
- ✓ Prettier formatting OK
- ✓ Build produkcyjny się buduje
- ✓ Wszystkie unit testy przechodzą
- ✓ E2E testy przechodzą
- ✓ Code coverage generuje się

---

## 🔴 Troubleshooting

### Pipeline Failed?

1. Kliknij na failowany job
2. Rozwiń kroki (scroll down)
3. Szukaj błędu w logu
4. Fix lokalnie + push

### Przykład Fix

```bash
# Linting error
npm run lint:fix
git add .
git commit -m "fix: eslint issues"
git push

# Build error
npm run build
# Fix error, then commit
```

---

## 📚 Gdzie Szukać Info?

| Pytanie                       | Dokument                      |
| ----------------------------- | ----------------------------- |
| Co robi każdy job?            | `.github/workflows/README.md` |
| Jak używać composite actions? | `.github/actions/README.md`   |
| Pełny setup?                  | `.github/CI_CD_SETUP.md`      |
| Szybki start?                 | Ten plik 🎯                   |

---

## 🎯 Best Practices

✅ **DO**:

- Pushuj do feature branch, otwieraj PR
- Czekaj na pipeline przed merge
- Sprawdzaj logs gdy coś nie działa
- Runuj lokalnie `npm run test:unit` + `npm run build` przed push

❌ **DON'T**:

- Force push do master
- Ignoruj failujące pipeline
- Pushuj bez testów
- Disable pipeline checks

---

## 🔗 Useful Commands

```bash
# Local testing
npm run test:unit              # Vitest
npm run test:e2e               # Playwright
npm run build                  # Production build
npm run lint                   # ESLint check
npm run format -- --check      # Prettier check

# Watch mode
npm run test:unit:watch        # Auto-rerun on change
npm run dev                    # Dev server

# UI
npm run test:unit:ui           # Vitest UI
npm run test:e2e:ui            # Playwright UI
```

---

## 💡 Pro Tips

1. **Branch Naming**

   ```
   feature/add-login
   fix/auth-token-bug
   refactor/component-structure
   ```

2. **PR Template**

   ```
   ## What?
   - Brief description

   ## Why?
   - Motivation

   ## How?
   - Changes overview
   ```

3. **Debugging Locally**

   ```bash
   # Before push
   npm run lint
   npm run test:unit
   npm run build

   # Then push knowing pipeline will pass
   ```

---

## 📞 Support

### Common Issues

| Issue                 | Solution                                   |
| --------------------- | ------------------------------------------ |
| Node version mismatch | Check `.nvmrc`, update if needed           |
| npm ci fails          | Delete `node_modules`, clear cache         |
| E2E timeout           | Increase timeout or reduce test complexity |
| Coverage upload fails | It's OK, pipeline continues                |

### Resources

- [GitHub Actions](https://docs.github.com/en/actions)
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)

---

**Ready? Push your code! 🚀**
