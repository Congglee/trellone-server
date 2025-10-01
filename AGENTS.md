# Repository Guidelines

## Project Structure & Module Organization
- `src/app.ts` bootstraps Express, middleware, and Socket.IO glue; `src/index.ts` is the compiled entry point.
- Business logic is grouped by responsibility: `controllers/`, `services/`, `routes/`, and `middlewares/`, with shared helpers in `utils/` and configuration in `config/`.
- Real-time handlers sit in `sockets/`; transactional docs live in `docs/`; email templates live in `templates/`; local asset uploads are stored under `/uploads` during development.

## Build, Test & Development Commands
- `npm run dev` starts nodemon with `NODE_ENV=development`; use `dev:stag` or `dev:prod` to mimic other environments.
- `npm run build` clears `dist/`, compiles TypeScript, and rewrites aliases via `tsc-alias`.
- `npm run start:dev|start:stag|start:prod` runs the compiled server with the appropriate environment flag.
- `npm run lint`, `npm run lint:fix`, `npm run prettier`, and `npm run prettier:fix` must be clean before opening a PR.

## Coding Style & Naming Conventions
- Prettier governs formatting: 2-space indent, no semicolons, single quotes, 120-character lines, as defined in `.prettierrc` and `.editorconfig`.
- TypeScript strict mode is on; add explicit types and narrow `any` usage. Prefer `~/<module>` path aliases from `tsconfig.json` for intra-project imports.
- Use kebab-case file names and export named functions matching the route or service purpose.

## Testing Guidelines
- No automated test script exists yet; bootstrap Jest + Supertest (or equivalent) under `src/tests/` or `src/__tests__/`, mirror feature names (e.g. `users.controller.test.ts`), and add an `npm test` script before relying on CI.
- Cover new endpoints with integration tests hitting real routes and asserting authorization, validation, and socket side-effects. Target critical board, column, and card flows before expanding to helpers.

## Commit & Pull Request Guidelines
- Follow Conventional Commits as seen in history (`docs:`, `refactor(permissions):`); keep scope tight and descriptive.
- PRs should explain the change set, call out environment variables or configuration docs touched, and attach API response samples or screenshots when payloads change. Link issues or task IDs when available.

## Environment & Configuration Tips
- Copy `.env.example` to `.env.development` (and peers) and populate secrets; the server loads the file matching `NODE_ENV`.
- Centralize new configuration keys in `src/config/environment.ts` so they remain discoverable and typed, and document corresponding setup in `src/docs/` when adding external integrations.
