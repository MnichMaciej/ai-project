# GitHub Actions - Composite Actions

## Overview

This directory contains reusable composite actions that standardize common workflow tasks across all GitHub Actions workflows in this project.

## 📋 Available Actions

### 1. `setup-environment`

**Location**: `.github/actions/setup-environment/action.yml`

**Purpose**: Unified environment setup for all workflows

**What it does**:

- Checks out the repository code
- Installs and configures Node.js from `.nvmrc`
- Enables NPM caching for faster builds
- Installs project dependencies using `npm ci`

**When to use**: At the beginning of any workflow that needs Node.js and dependencies

**Example usage**:

```yaml
steps:
  - uses: ./.github/actions/setup-environment
```

**Configuration**:

- Node version: Read from `.nvmrc` (currently 22.14.0)
- Cache: NPM cache enabled
- Install method: `npm ci` (clean install, more reliable than `npm install`)

---

### 2. `lint-code`

**Location**: `.github/actions/lint-code/action.yml`

**Purpose**: Code quality checks (linting and formatting)

**What it does**:

- Runs ESLint validation (`npm run lint`)
- Checks code formatting with Prettier (`npm run format -- --check`)
- Fails if any linting or formatting issues are found

**When to use**: Early in the workflow to catch quality issues before building

**Example usage**:

```yaml
steps:
  - uses: ./.github/actions/setup-environment
  - uses: ./.github/actions/lint-code
```

**Configuration**:

- ESLint config: `.eslintrc.mjs` (project root)
- Prettier config: `.prettierrc` (project root)

---

## 🔄 Current Workflow Integration

### master.yaml

#### Job: Setup & Validate

```yaml
steps:
  - uses: actions/checkout@v5
  - uses: actions/setup-node@v6
  - run: npm ci
  - run: npm run lint
```

**Note**: Setup and lint steps are inlined here because:

- First job in the pipeline sets baseline
- Simple, transparent steps for CI overview
- No need for abstraction at this stage

---

## 🎯 Best Practices

✅ **Do**:

- Keep composite actions focused and single-purpose
- Use `shell: bash` for cross-platform compatibility
- Document what the action does and when to use it
- Version control composite actions alongside workflows

❌ **Don't**:

- Create composite actions that are only used once
- Include too many conditional steps
- Forget to update action.yml documentation

---

## 🚀 Creating New Composite Actions

To create a new reusable composite action:

1. Create directory: `.github/actions/my-action-name/`
2. Create `action.yml` with proper metadata
3. Define steps using `runs.using: composite`
4. Add `shell: bash` to all run steps for consistency
5. Document in this README

### Template:

```yaml
name: My Custom Action
description: What this action does

runs:
  using: composite
  steps:
    - name: Step description
      run: npm run my-script
      shell: bash
```

---

## 📊 Action Statistics

| Action            | Purpose           | Runs              | Last Updated |
| ----------------- | ----------------- | ----------------- | ------------ |
| setup-environment | Environment setup | Used in all jobs  | Nov 2024     |
| lint-code         | Code quality      | Used in setup job | Nov 2024     |

---

## 🔗 Related Files

- Main workflow: `.github/workflows/master.yaml`
- Workflow documentation: `.github/workflows/README.md`
- Project configuration: `package.json`, `.nvmrc`, `.eslintrc.mjs`, `.prettierrc`

---

## 💡 Tips for Maintenance

1. Keep composite actions synchronized with project configuration
2. Update composite actions when adding new npm scripts
3. Test composite actions locally before committing
4. Document breaking changes clearly in action.yml description
