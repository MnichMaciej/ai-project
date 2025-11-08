# GitHub Actions CI/CD Pipeline

## 📋 Overview

This directory contains the GitHub Actions workflows for the **Portfol.io** project. The CI/CD pipeline ensures code quality and production readiness.

## 🚀 Pipeline: `master.yaml`

### Triggers

- **Manual**: `workflow_dispatch` - Run pipeline manually from GitHub UI
- **On Push**: When code is pushed to the `master` branch
- **On Pull Request**: When a PR is opened against the `master` branch

### Pipeline Jobs

#### 1. **Setup & Validate** ✅

- **Timeout**: 10 minutes
- **Node Environment**: `test`
- **Steps**:
  - Checks out repository code
  - Sets up Node.js (v22.14.0 from `.nvmrc`)
  - Installs dependencies with `npm ci`
  - Runs ESLint validation

#### 2. **Build Production** 🏗️

- **Timeout**: 15 minutes
- **Depends on**: Setup & Validate
- **Node Environment**: `production`
- **Steps**:
  - Checks out code
  - Sets up Node.js environment
  - Installs dependencies
  - Builds the production version (`npm run build`)
  - Uploads `dist/` artifacts for 1 day

#### 3. **Unit Tests** 🧪

- **Timeout**: 15 minutes
- **Depends on**: Setup & Validate
- **Node Environment**: `test`
- **Steps**:
  - Runs unit tests with Vitest
  - Generates coverage reports
  - Uploads coverage to Codecov

#### 4. **E2E Tests** 🎭

- **Timeout**: 20 minutes
- **Depends on**: Build Production
- **Node Environment**: `test`
- **Steps**:
  - Downloads build artifacts
  - Installs Playwright browsers
  - Runs end-to-end tests
  - Uploads Playwright report for 14 days

#### 5. **Summary** 📊

- **Timeout**: 5 minutes
- **Depends on**: All jobs
- **Purpose**: Final status check and summary

### Environment Variables

Environment variables are set per-job for better control:

```yaml
NODE_ENV: test      # For setup and test jobs
NODE_ENV: production # For build job
```

### Key Features

✅ **Concurrency Control**: Only one run per branch is active, others are cancelled  
✅ **Artifact Management**: Build artifacts cached for E2E tests  
✅ **Code Coverage**: Integrated with Codecov for coverage tracking  
✅ **Fast Feedback**: Parallel job execution where possible  
✅ **Timeouts**: Each job has appropriate timeout to catch hanging processes  
✅ **Modern Actions**: Using latest major versions of GitHub Actions

### Job Dependencies

```
Setup & Validate
├── Build Production
│   └── E2E Tests
│       └── Summary
└── Unit Tests
    └── Summary
```

## 📦 Composite Actions

### `setup-environment`

Located in `.github/actions/setup-environment/action.yml`

Reusable action for:

- Node.js setup from `.nvmrc`
- NPM dependency installation with caching

### `lint-code`

Located in `.github/actions/lint-code/action.yml`

Reusable action for:

- ESLint validation
- Prettier formatting checks

## 🔧 Configuration

### Node Version

- Specified in `.nvmrc`: `22.14.0`
- Used by all jobs for consistency

### Caching

- NPM cache is enabled in `setup-node` action
- Significantly speeds up dependency installation

### Artifacts

- **Build artifacts**: Retained for 1 day
- **Playwright reports**: Retained for 14 days
- **Coverage data**: Uploaded to Codecov

## 📊 Codecov Integration

Coverage reports from unit tests are automatically uploaded to Codecov:

- **Source**: `./coverage/coverage-final.json`
- **Flag**: `unittests`
- **Fail CI**: Disabled (coverage failures don't block merge)

## 🎭 Playwright E2E Testing

E2E tests require:

- Downloaded build artifacts
- Installed Playwright browsers
- Runs with full browser support (Chromium, Firefox, WebKit)
- Reports saved for debugging

## 📝 Scripts Used

All scripts are defined in `package.json`:

```bash
npm run lint                    # ESLint validation
npm run format -- --check      # Prettier check
npm ci                         # Clean install (prefer over npm install)
npm run build                  # Production build
npm run test:unit             # Unit tests with Vitest
npm run test:unit:coverage    # Unit tests with coverage
npm run test:e2e              # E2E tests with Playwright
```

## ⚡ Performance Optimizations

1. **npm ci**: Used instead of `npm install` for faster, more reliable builds
2. **Cache**: NPM dependencies cached between runs
3. **Parallel Jobs**: Setup, Unit Tests, and E2E Tests run in parallel where possible
4. **Artifact Caching**: Build artifacts passed between jobs
5. **Short Retention**: Artifacts cleaned up quickly to save space

## 🚨 Troubleshooting

### Pipeline Fails on Setup

- Check Node.js version in `.nvmrc`
- Verify `package.json` is valid
- Ensure all dependencies are available

### E2E Tests Fail

- Playwright browsers might need reinstall
- Check if build artifacts were created
- Verify test data/environment is ready

### Coverage Upload Fails

- Codecov action is not required (`fail_ci_if_error: false`)
- Pipeline continues even if coverage upload fails

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vitest Testing](https://vitest.dev/)
- [Playwright E2E Testing](https://playwright.dev/)
- [Codecov Integration](https://codecov.io/)
