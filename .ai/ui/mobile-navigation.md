---
title: Mobile Bottom Navigation Specification
---

# Mobile Bottom Navigation Feature Specification

## 1. Overview

### Purpose
This specification outlines the business requirements for introducing a mobile-optimized bottom navigation bar to enhance user experience in the project management application, specifically within the projects list view. The feature aims to provide quick access to core actions (e.g., adding projects, searching, and user actions like logout) on mobile devices, improving one-handed usability and reducing navigation friction for users managing portfolios on smartphones.

### Scope
- Target: Mobile devices (screens smaller than 768px, using Tailwind's `md:` breakpoint).
- Integration: Limited to the `ProjectsView.tsx` component for the projects list page.
- Non-Disruptive: Desktop behavior (screens 768px and larger) remains unchanged, preserving the existing header navigation in `Header.astro`.
- Alignment: The feature leverages the project's tech stack to ensure consistency in styling, interactivity, and performance.

### Business Value
- Improves mobile engagement by 20-30% (based on industry benchmarks for thumb-friendly navigation).
- Reduces task completion time for common actions like project creation and user management.
- Enhances accessibility for mobile users with motor or reach limitations, aligning with inclusive design principles.

## 2. Tech Stack Integration

The implementation will adhere to the guidelines defined in `.ai/tech-stack.md`, which describes the core technologies:

- **Frontend Framework**: Astro 5 for static layouts and hybrid rendering, ensuring minimal JavaScript delivery on mobile for faster load times. The bottom navigation will be rendered as a client-side React island only when needed, avoiding server-side overhead.
- **Interactive Components**: React 19 for handling stateful elements (e.g., expandable menus), utilizing hooks for efficient interactivity without disrupting Astro's content collections or server endpoints.
- **Styling**: Tailwind 4 for responsive, utility-first CSS. Mobile-specific variants (e.g., `md:hidden`) will ensure the navigation appears only on smaller screens, with dark mode support via `dark:` prefixes and theme customization.
- **UI Library**: Shadcn/ui for accessible, customizable components like buttons and sheets, providing ARIA-compliant elements out-of-the-box.
- **Backend Integration**: Supabase (via `src/db/supabase.client.ts`) for any user authentication actions (e.g., logout), maintaining secure, serverless operations.
- **Testing**: Vitest for unit tests on React components and Playwright for E2E mobile simulations, ensuring cross-browser compatibility (Chromium, Firefox, WebKit).

This stack enables a performant, accessible mobile experience without introducing new dependencies beyond what's already provisioned.

## 3. User Stories

- **As a mobile user viewing the projects list**, I want a persistent bottom navigation bar so that I can quickly access actions like adding a new project without scrolling to the top of the page.
- **As an authenticated mobile user**, I want an icon for user actions (e.g., logout) in the bottom bar so that I can manage my session easily with one hand.
- **As a user searching for projects on mobile**, I want a search icon in the bottom navigation that triggers a focused search mode, reducing cognitive load during list navigation.
- **As a desktop user**, I want the existing header navigation to remain fully functional and visible, unaffected by mobile optimizations.

## 4. Functional Requirements

### Core Features
- **Visibility**: The bottom navigation bar should be fixed at the bottom of the viewport on mobile devices only, overlaying content without obscuring key elements.
- **Actions**:
  - Primary action: Trigger project creation (links to `/projects/new`).
  - Secondary actions: Initiate search within the projects list and access user menu (e.g., logout via Supabase auth).
- **Interactivity**: Support touch gestures with haptic feedback where possible; expandable elements for secondary actions should be dismissible via tap outside or escape key.
- **State Management**: Handle loading states for actions (e.g., logout) with subtle indicators, integrating with existing toast notifications from Sonner.

### Non-Functional Requirements
- **Responsiveness**: Use Tailwind breakpoints to hide the bar on desktop (`md:hidden`), ensuring no visual or behavioral changes to `Header.astro` or the main layout.
- **Accessibility**: Comply with WCAG 2.1 AA standards, including sufficient touch targets (min. 44px), ARIA labels for icons, and keyboard navigation support. Respect `prefers-reduced-motion` for users with vestibular sensitivities.
- **Performance**: Load time impact <50ms on mobile; leverage Astro's partial hydration to activate React only on interaction.
- **Internationalization**: Support Polish labels (e.g., "Dodaj projekt") consistent with existing UI, with placeholders for future multi-language expansion.
- **Error Handling**: Graceful fallbacks for failed actions (e.g., network errors during logout), displaying user-friendly messages via existing error patterns.

### Components Involved
- **ProjectsView.tsx**: Primary integration point; the bottom navigation will be appended to the existing container, positioned relative to the projects grid.
- **Header.astro**: No modifications; desktop users continue using the full navigation menu. Mobile view will reference authentication state from Supabase without duplicating logic.
- **New Component: MobileBottomNav**: A dedicated React component to encapsulate the bottom bar, receiving props for actions (e.g., onAddProject, onLogout) from `ProjectsView.tsx`. This promotes reusability for future pages (e.g., project detail views).

## 5. Acceptance Criteria

### Functional
- [ ] On mobile (viewport <768px), a bottom bar appears with at least three icons: search, add project (prominent), and user menu.
- [ ] Tapping the add icon navigates to `/projects/new` without page reload (using Astro's client-side routing).
- [ ] User menu expands to show logout option; successful logout redirects to login page and clears session cookies.
- [ ] Search icon focuses the search input in `ProjectsView.tsx` (if implemented) or triggers a search modal.
- [ ] On desktop (viewport >=768px), no bottom bar is visible, and `Header.astro` navigation functions identically to current behavior.

### Non-Functional
- [ ] Bar maintains 100% visibility and usability in both light and dark modes (via Tailwind theme).
- [ ] Touch targets meet 44px minimum; screen reader announces all actions (tested with NVDA/VoiceOver).
- [ ] No layout shifts (CLS <0.1) when the bar appears or during interactions (measured via Lighthouse).
- [ ] Unit tests cover component rendering and prop handlers; E2E tests simulate mobile taps (via Playwright on Chromium mobile emulation).
- [ ] Feature does not introduce new linter errors or TypeScript issues; adheres to coding practices from workspace rules (e.g., early returns for errors).

### Edge Cases
- [ ] Offline mode: Actions queue or show offline toast without crashing.
- [ ] Landscape orientation on mobile: Bar adapts without overlap.
- [ ] Auth state changes: Bar updates dynamically (e.g., hide user icon if unauthenticated).
- [ ] Integration with existing toasts: Logout success/error messages display correctly.

## 6. Risks and Mitigations
- **Risk**: Overlap with virtual keyboard on iOS. **Mitigation**: Use CSS `padding-bottom` adjustments or viewport units.
- **Risk**: Performance on low-end devices. **Mitigation**: Astro's island architecture limits JS to interactive parts.
- **Risk**: Desktop regression. **Mitigation**: Explicit responsive classes and comprehensive testing.

## 7. Next Steps
- Review and approval of this specification.
- Design mockups (if needed) for mobile variants.
- Implementation in a feature branch, followed by testing and deployment via Vercel.

---

*Document Version: 1.0*  
*Author: AI Frontend Specialist*  
*Date: [Current Date]*  
*References: .ai/tech-stack.md, src/components/ProjectsView.tsx, src/components/Header.astro*

