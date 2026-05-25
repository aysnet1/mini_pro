# General Workspace Instructions

## Development Stack

- **Package Manager**: Always use `pnpm` for all package management tasks (install, update, remove, run scripts).
- **UI Framework**: Use the latest version of `shadcn-vue`. Adhere to its component patterns and documentation. Components should be placed in `src/components/ui/`.
- **Icons**: Use `lucide-vue-next` for all icons. Avoid using other icon libraries unless explicitly requested.

## Project Structure Conventions

- **Pages**: Top-level views belong in `src/pages/`.
- **Layouts**: Layout components belong in `src/layouts/
Text language frensh
`.
- **Stores**: State management (e.g., Pinia) files belong in `src/stores/`.
- **Backend**: Server-side code is located in `src-ssr/`.

## Workflow & Context

- **Context Gathering (Read Folder and Work)**: Before implementing new features or making architectural changes, explore the project folder structure and read relevant existing files (like `package.json`, `quasar.config.js`). Always ensure you have sufficient context of the existing codebase to maintain consistency.
