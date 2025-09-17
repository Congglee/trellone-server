# Repository Guidelines

## Project Structure & Module Organization
Source code lives in `src/` with Express entrypoints in `src/index.ts` and app bootstrap in `src/app.ts`. Feature domains are separated into `controllers/`, `services/`, `routes/`, and `sockets/`; shared helpers sit in `utils/` and `constants/`. Configuration and providers live under `config/` and `providers/`. Uploaded assets during development are stored in `uploads/`, while reusable email or layout templates live in `templates/`. Keep new modules aligned with this domain-first layering.

## Build, Test, and Development Commands
- `npm run dev`: start the Nodemon watcher with development.env loaded.
- `npm run dev:prod` / `npm run dev:stag`: simulate other environments with the same watcher loop.
- `npm run build`: clean `dist/`, compile TypeScript, and rewrite aliases; run before packaging or deploying.
- `npm run start:dev` (or `start:prod`, `start:stag`): execute the built server from `dist/index.js` for environment smoke tests.
- `npm run lint` and `npm run prettier`: static analysis and formatting checks; use the `:fix` variants before opening a PR.

## Coding Style & Naming Conventions
TypeScript files use 2-space indentation (see `.editorconfig`). Prefer named exports per module and keep DTOs or interfaces in `type.d.ts` or colocated `*.types.ts`. Follow camelCase for variables or functions, PascalCase for classes, and dash-case for route files. ESLint (`eslint.config.mjs`) and Prettier enforce import order and whitespace; run both locally to avoid CI lint failures.

## Testing Guidelines
No automated test suite ships today; new features should add integration tests (Jest plus Supertest is the preferred stack) under a future `tests/` directory mirroring `src/`. Until then, provide manual validation notes in the PR and ensure `npm run build` and `npm run lint` pass. Aim for meaningful coverage around controllers, services, and socket event flows.

## Commit & Pull Request Guidelines
Follow the established Conventional Commit pattern (for example, `feat(workspaces): ...`, `fix(auth): ...`). Commits should stay focused and reference Jira or GitHub issues when relevant. Pull requests must include a summary of changes, testing evidence (commands and results), environment variables touched, and screenshots or API examples when impacting clients. Assign at least one reviewer, request re-review after force-pushes, and keep conversations resolved before merge.

## Configuration & Secrets
Environment presets live in `.env.example` plus stage-specific files. Never commit new secrets; update `.env.example` with safe defaults whenever variables change. Document required third-party API keys (Resend, UploadThing, Unsplash) in your PR description and coordinate rotation with maintainers when altering scopes.
