# Portfol.io

Portfol.io is a Minimum Viable Product (MVP) web application designed to help developers manage and showcase their project portfolios efficiently.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope](#project-scope)
- [Project Status](#project-status)
- [License](#license)

## Project Description

Portfol.io provides a centralized platform for developers to store and present information about their projects, including descriptions, technologies used, status, preview images, and links to repositories or live demos. A key feature is AI-powered automation: users can provide raw file links from public GitHub repositories, and the AI will generate project descriptions and identify the technology stack, saving time on documentation.

The app addresses the challenge of scattered project information by offering a simple, automated way to build and maintain a professional portfolio. It's built for individual use in the MVP stage, focusing on core management features without social or hosting capabilities.

For detailed requirements, see the [Product Requirements Document (PRD)](.ai/prd.md).

## Tech Stack

### Frontend

- **Astro 5**: For building fast, content-focused web pages with minimal JavaScript.
- **React 19**: For interactive client-side components.
- **TypeScript 5**: For type-safe development and better IDE support.
- **Tailwind CSS 4**: Utility-first CSS framework for rapid styling.
- **Shadcn/ui**: Accessible React UI components built on Radix UI and Tailwind.

### Backend

- **Supabase**: Open-source Backend-as-a-Service (BaaS) providing PostgreSQL database, authentication, and SDKs. Self-hostable for flexibility.

### AI Integration

- **Openrouter.ai**: API service for accessing multiple AI models (e.g., OpenAI, Anthropic, Google) to analyze code files and generate content, with built-in cost controls.

### Development Tools

- Node.js 22.14.0 (specified in `.nvmrc`).
- ESLint and Prettier for code linting and formatting.
- Husky and lint-staged for pre-commit hooks.

Full dependencies are listed in [package.json](package.json).

## Getting Started Locally

### Prerequisites

- Node.js version 22.14.0 (use [nvm](https://github.com/nvm-sh/nvm) to manage versions: `nvm use` after cloning).
- npm (v10+ recommended).
- Git.
- A Supabase account (for database and auth setup).
- An Openrouter.ai API key (for AI features).

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/portfol.io.git
   cd portfol.io
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables:
   Create a `.env` file in the root with your Supabase and Openrouter credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   ```
   (Replace placeholders with actual values from your Supabase project dashboard and Openrouter account.)
4. Run the development server:
   ```
   npm run dev
   ```
   The app will be available at `http://localhost:4321`.

For production builds, see the scripts below. Additional setup details for Supabase (e.g., database schema) can be found in the [tech stack doc](.ai/tech-stack.md).

## Available Scripts

In the project root, you can run:

- `npm run dev`: Starts the development server with hot reloading.
- `npm run build`: Builds the app for production (outputs to `dist/`).
- `npm run preview`: Previews the production build locally.
- `npm run astro`: Runs Astro CLI commands (e.g., `npm run astro check` for type-checking).
- `npm run lint`: Runs ESLint to check for code issues.
- `npm run lint:fix`: Fixes linting issues automatically.
- `npm run format`: Formats code with Prettier.

## Project Scope

### In Scope (MVP)

- **Authentication**: Email/password registration and login, strong password policy, account lock after 5 failed logins, self-service account deletion.
- **Project Management (CRUD)**: Create, read, update, and delete projects with fields for name (required), description (required), technologies (required), status (planning, in progress, MVP completed, completed), preview image (optional), repo link (optional), demo link (optional).
- **User Experience**: Dashboard listing projects, empty state for new users with CTA to add first project, profile page showing projects.
- **AI Features**: Button in project edit form to generate description and technologies from up to 8 GitHub raw file links (max 100KB/file), limited to 5 queries per project. Generated content auto-fills form fields for editing.
- **Limits and Security**: Enforce AI usage limits client- and server-side, user-friendly error messages.

### Out of Scope (MVP)

- Social features (e.g., sharing, following users).
- Repository hosting or cloning.
- App hosting for user projects.
- Admin panel (e.g., account unlocking requires manual contact).
- Advanced project features (e.g., filtering, sorting by status).
- Public user profiles.
- Additional auth methods (e.g., OAuth with GitHub/Google).

Unresolved items include final AI model selection and account unlock process (e.g., admin email contact). For full details, refer to the [PRD](.ai/prd.md).

### Success Metrics

- 100% of registered users have at least one project.
- 75% of users utilize AI for project descriptions and tech stacks.

## Project Status

This is an MVP in active development. The codebase starts from an Astro template (`10x-astro-starter`) and is currently clean with no pending commits. Core features (auth, CRUD, AI integration) are planned per the PRD user stories. AI model and backend setup (Supabase) are pending configuration.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. (Note: If no LICENSE file exists, create one with standard MIT terms.)
