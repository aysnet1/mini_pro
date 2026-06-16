# General Workspace Instructions

## Development Stack

- **Package Manager**: Always use `pnpm` for all package management tasks (install, update, remove, run scripts).
- **CSS Framework**: Use Tailwind CSS v4 exclusively. Use `bg-linear-to-*` syntax for gradients (not `bg-gradient-to-*`). Leverage utility-first approach with clean, modern design patterns.
- **UI Components**: Use modular component architecture. Components should be reusable, well-structured, and placed in appropriate subdirectories under `src/components/`.
- **State Management**: Always use Pinia stores for state management. Define stores in `src/stores/` and use the composition API pattern with `defineStore`.
- **Icons**: Use `lucide-vue-next` for all icons. Avoid using other icon libraries unless explicitly requested.
- **Language**: All UI text and comments must be in French.

## Project Structure Conventions

- **Pages**: Top-level views belong in `src/pages/`.
- **Layouts**: Layout components belong in `src/layouts/`.
- **Components**: Reusable components belong in `src/components/` with modular organization (e.g., `src/components/ui/`, `src/components/chat/`).
- **Stores**: Pinia state management files belong in `src/stores/`.
- **Composables**: Reusable composition functions belong in `src/composables/`.
- **Backend**: Server-side code is located in `src-ssr/` with clear separation:
  - Controllers: `src-ssr/controllers/`
  - Routes: `src-ssr/routers/`
  - Middleware: `src-ssr/middlewares/`
  - Database: `src-ssr/database/`

## Code Style & Quality

- **Comments**: Use clear, concise comments in French. No emojis in code comments or commit messages.
- **Design**: Prioritize clean, modern UI design with proper spacing, typography hierarchy, and consistent color schemes.
- **Components**: Use Vue 3 Composition API with `<script setup>` syntax.
- **Type Safety**: Use JSDoc comments for type annotations where TypeScript is not used.
- **Naming**: Use descriptive, French-inspired naming for UI elements when appropriate, but keep technical names in English.
- **Animations**: Use minimal, subtle animations. Avoid excessive or complex animation effects. Prefer simple transitions (duration-200, duration-300) over elaborate keyframe animations.

## Backend Architecture

- **Controllers**: Each controller handles specific domain logic (e.g., `UserControllers.js`, `LogementControllers.js`).
- **Routes**: Define RESTful routes in separate router files (e.g., `UserRoutes.js`, `LogementRoutes.js`).
- **Middleware**: Implement authentication, authorization, and other cross-cutting concerns as middleware.
- **Database**: Use MySQL with parameterized queries to prevent SQL injection.

## Workflow & Context

- **Context Gathering**: Before implementing new features or making architectural changes, explore the project folder structure and read relevant existing files (like `package.json`, `quasar.config.js`). Always ensure you have sufficient context of the existing codebase to maintain consistency.
- **Component Development**: Create modular, reusable components with clear props, emits, and slots when needed.
- **Store Usage**: Always create or update Pinia stores for shared state before implementing component logic.
- **Design Consistency**: Maintain clean, modern design patterns with Tailwind CSS v4 utilities. Use gradients, shadows, and transitions for enhanced UX.
