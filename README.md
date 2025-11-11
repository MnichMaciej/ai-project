# Portfol.io

[![Version](https://img.shields.io/badge/version-0.0.1-blue)](https://github.com/maciejmnich/portfol-io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-22.14.0-green)](https://nodejs.org/)

## Table of Contents

- [Project Description](#project-description)
- [Demo](#demo)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Portfol.io is a Minimum Viable Product (MVP) web application designed to help developers manage their project portfolios efficiently. It provides a centralized platform to store and showcase project details, including names, descriptions, technologies used, status (planning, in progress, MVP completed, completed), preview images, repository links, and demo links.

The standout feature is AI integration via Openrouter.ai, which analyzes raw file links from public GitHub repositories to automatically generate project descriptions and identify the technology stack. This significantly reduces the time spent on manual documentation, addressing the common pain point of scattered project information that makes it hard to present work to employers, clients, or the community.

Built with modern tools for a fast, type-safe experience, Portfol.io focuses on core functionality while enforcing security (e.g., email/password auth with account locking) and usability (e.g., empty state for new users).

## Demo

Try the live demo at [https://portfol-io-maciej-mnich.vercel.app/](https://portfol-io-maciej-mnich.vercel.app/).

## Tech Stack

### Frontend

- **Astro 5**: For building fast, content-focused websites with minimal JavaScript.
- **React 19**: Powers interactive components where dynamic behavior is needed.
- **TypeScript 5**: Ensures type safety and better developer experience.
- **Tailwind CSS 4**: Utility-first CSS framework for rapid, responsive styling.
- **Shadcn/ui**: Accessible, customizable React components built on Radix UI and Tailwind.

### Backend

- **Supabase**: Open-source Firebase alternative providing PostgreSQL database, authentication, and SDKs as a Backend-as-a-Service (BaaS). Supports local hosting or cloud deployment.

### AI Integration

- **Openrouter.ai**: Gateway to various AI models (e.g., Google Gemini, DeepSeek, OpenAI) for analyzing code files and generating content. Allows API key-based cost controls.

### Testing

- **Vitest**: Fast unit testing framework with ESM support and Vite integration.
- **React Testing Library**: User-centric testing for React components.
- **Playwright**: End-to-end testing across Chromium, Firefox, and WebKit browsers.
- **Codecov**: Code coverage reporting and tracking.

### Hosting

- **Vercel**: Serverless platform with native Astro SSR support, global CDN, GitHub auto-deploys, and environment variable management. Free tier suitable for side projects.

## Getting Started Locally

To run Portfol.io locally, follow these steps:

### Prerequisites

- Node.js version 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions: `nvm use` after cloning).
- Git.
- Supabase account (free tier) for database and auth setup.
- Openrouter.ai API key for AI features.

### Setup

1. Clone the repository:

   ```
   git clone https://github.com/maciejmnich/portfol-io.git
   cd portfol-io
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the root with your Supabase credentials:
     ```
     PUBLIC_SUPABASE_URL=your_supabase_project_url
     PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
     SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
     OPENROUTER_API_KEY=your_openrouter_api_key
     ```
   - Get Supabase details from your project dashboard (supabase.com).
   - Obtain Openrouter API key from openrouter.ai.

4. Initialize the database:
   - Run migrations to set up tables (projects, users, auth, feature flags):
     ```
     npm run db:push
     ```

5. Start the development server:

   ```
   npm run dev
   ```

   - The app will be available at `http://localhost:4321`.

### Notes

- Ensure your Supabase project has Row Level Security (RLS) disabled for initial testing (as per migrations).
- For production, enable RLS and configure auth policies.
- AI features require a valid Openrouter key; without it, fallback to manual entry.

## Available Scripts

Run these with `npm run <script>`:

- `dev`: Start the development server with hot reloading.
- `build`: Build the project for production.
- `preview`: Preview the production build locally.
- `lint`: Run ESLint to check code quality.
- `lint:fix`: Fix linting issues automatically.
- `format`: Format code with Prettier.
- `test`: Run unit and E2E tests.
- `test:unit`: Run unit tests with Vitest.
- `test:unit:watch`: Run unit tests in watch mode.
- `test:unit:ui`: Run unit tests with Vitest UI.
- `test:unit:coverage`: Run unit tests with coverage report.
- `test:e2e`: Run end-to-end tests with Playwright.
- `test:e2e:ui`: Run E2E tests in UI mode.
- `test:e2e:codegen`: Generate E2E test code interactively.
- `test:e2e:debug`: Debug E2E tests.
- `db:push`: Push local database migrations to Supabase.

Pre-commit hooks (via Husky and lint-staged) automatically lint and format code.

## Project Scope

### MVP Inclusions

- **Authentication**: Email/password registration/login with strong password policy. Account locking after 5 failed logins (contact admin to unlock). Permanent account deletion with data removal.
- **Project Management (CRUD)**: Create, read, update, delete projects with required fields (name, description, technologies, status). Optional preview image, repo/demo links. List view on dashboard; empty state for new users with CTA to add first project.
- **AI Integration**: Button in project edit form to analyze up to 8 GitHub raw file links (max 100KB each). Generates description and tech stack. Limits: 5 queries per project. Fallbacks on primary model failure (sequence: google/gemini-2.0-flash-exp:free → deepseek/deepseek-chat-v3.1:free → openai/gpt-oss-20b:free). Error handling for unavailability.
- **Profile**: Displays user's project list.
- **Success Metrics**: Tracked via SQL queries (e.g., 100% users have ≥1 project; 75% use AI).

### Exclusions from MVP

- Social features (sharing, comments).
- Repo storage/cloning or project hosting.
- Admin panel for user management.
- Advanced project filtering/sorting.
- Public user profiles.
- OAuth logins (e.g., GitHub/Google).

### Unresolved

- Exact AI model selection based on cost/performance (decided post-technical analysis).
- Account unlock process (e.g., email/form to admin).

For full details, see [PRD](./.ai/prd.md).

## Project Status

This is an active MVP under development. Core features (auth, CRUD, AI) are implemented with testing in place. Future updates may include public profiles and advanced features based on user feedback.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. If no LICENSE file exists, create one with standard MIT terms.
