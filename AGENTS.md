# AGENTS.md

## Project overview

- **Purpose**: Trellone API server (Express + TypeScript) providing REST + Socket.IO for Trello-like boards/workspaces.
- **Architecture**: Express app with modular routes, services, controllers, MongoDB via official driver, Socket.IO for realtime.
- **Main modules**:
  - `src/app.ts`: app composition (middlewares, routes, socket init)
  - `src/index.ts`: process lifecycle, boot, graceful shutdown
  - `src/services/database.services.ts`: MongoDB connection and collections
  - `src/routes/*`, `src/controllers/*`, `src/services/*`, `src/middlewares/*`
  - `src/models/schemas/*` and `src/models/requests/*`
  - `src/config/*`: env, cors, logger
  - `src/templates/*`: transactional emails
  - Alias: `~/*` → `src/*`

## Setup commands

- **Requirements**: Node.js 22+; MongoDB Atlas credentials; `.env.<env>` files.
- **Install**:

```bash
cd trellone-server
npm ci
```

- **Environment**: server requires `NODE_ENV` and corresponding `.env.<env>` file present in project root.

```bash
# Required .env.development (example)
NODE_ENV=development
PORT=8000
HOST=http://localhost

DB_NAME=trellone
DB_USERNAME=<username>
DB_PASSWORD=<password>

DB_WORKSPACES_COLLECTION=workspaces
DB_BOARDS_COLLECTION=boards
DB_COLUMNS_COLLECTION=columns
DB_CARDS_COLLECTION=cards
DB_USERS_COLLECTION=users
DB_REFRESH_TOKENS_COLLECTION=refresh_tokens
DB_INVITATIONS_COLLECTION=invitations

PASSWORD_SECRET=...

JWT_SECRET_ACCESS_TOKEN=...
JWT_SECRET_REFRESH_TOKEN=...
JWT_SECRET_EMAIL_VERIFY_TOKEN=...
JWT_SECRET_FORGOT_PASSWORD_TOKEN=...
JWT_SECRET_INVITE_TOKEN=...

ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=180d
EMAIL_VERIFY_TOKEN_EXPIRES_IN=1d
FORGOT_PASSWORD_TOKEN_EXPIRES_IN=1h
INVITE_TOKEN_EXPIRES_IN=7d

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
CLIENT_REDIRECT_CALLBACK=http://localhost:3000/auth/callback

CLIENT_URL=http://localhost:3000

RESEND_API_KEY=...
RESEND_EMAIL_FROM_ADDRESS=no-reply@example.com

UPLOADTHING_TOKEN=...

UNSPLASH_ACCESS_KEY=...
UNSPLASH_SECRET_KEY=...
UNSPLASH_APPLICATION_ID=...
```

- **Run in development** (long-running):

```bash
npm run dev
```

- **Build**:

```bash
npm run build
```

- **Start (compiled)**:

```bash
npm run start:dev   # or start:prod, start:stag (requires built dist and matching .env)
```

- **Lint / format**:

```bash
npm run lint
npm run lint:fix
npm run prettier
npm run prettier:fix
```

## Code style & conventions

- **TypeScript**: `strict: true`, module `NodeNext`, target `ES2023`, path alias `~/*` to `src/*`.
- **ESLint + Prettier**: single quotes, no semicolons, 120 print width; `@typescript-eslint/no-explicit-any` off.
- **Structure**: controller-service-model pattern; requests validated; error middleware at end of chain.

## Testing instructions

- No explicit test runner configured.
- **Proposal**: adopt Vitest or Jest for unit/integration tests; standard commands:

```bash
# Suggested (not configured yet)
npx vitest run --reporter=verbose
```

<!-- TODO: confirm testing stack and add scripts -->

## Security considerations

- **Env loading**: `NODE_ENV` is mandatory; the app exits if `.env.<env>` is missing.
- **CORS**: development allows all; non-dev uses `WHITELIST_DOMAINS` derived from `CLIENT_URL` and `GOOGLE_REDIRECT_URI`.
- **Secrets**: required JWT secrets and password secret; ensure strong values and secure secret storage.
- **Cookies/credentials**: endpoints expect `credentials: true`; align with frontend origin.
- **File uploads**: uses `formidable` and creates `uploads/*` folders at startup; ensure filesystem permissions.
- **Dependency audit**: `npm audit` regularly; `sharp` requires native deps in some environments.

## Commit & PR guidelines

- **Conventional Commits** recommended. <!-- TODO: confirm -->
- **Pre-merge**: lint, build, and typecheck must pass; ensure `.env.<env>` not committed.
- **Reviews/labels**: at least 1 approval; scope labels (`server`, `api`, `deps`). <!-- TODO: confirm -->

## Tooling & agent-executable commands

- Safe to run automatically:
  - `npm ci` — install deps
  - `npm run lint` — lint check
  - `npm run prettier` — formatting check
  - `npm run build` — compile to `dist/` and fix path aliases
- Long-running (run in background if needed):
  - `npm run dev` — nodemon + tsx, watches `src` and `.env`
  - `npm run start:dev|start:stag|start:prod` — run compiled server

## Deployment steps

- **Containerized**:
  - Multi-stage Dockerfile builds and prunes dev deps, then runs with `pm2-runtime`.
  - Exposes port 8000; ensure `.env.<env>` is copied (Dockerfile already copies `.env*`).

```bash
docker build -t trellone-server .
docker run --rm -p 8000:8000 --env-file .env.production trellone-server
```

- **Process manager**: `ecosystem.config.js` uses `npm run start:prod`.
- **Database migrations**: using MongoDB with application-managed schema; no migration framework present. <!-- TODO: confirm -->

## Data & assets

- HTML email templates in `src/templates/`.
- Upload directories created at runtime under `/uploads`.

## Monorepo tips (context)

- Backend lives here; frontend in sibling `trellone-app`.
- Maintain `AGENTS.md` in each repo; nearest file governs.

## Known pitfalls & gotchas

- Must set `NODE_ENV` and provide matching `.env.<env>` or the app exits.
- MongoDB Atlas URI uses `DB_USERNAME`/`DB_PASSWORD`/`DB_NAME`; ensure network access and correct credentials.
- CORS: update `CLIENT_URL` and `GOOGLE_REDIRECT_URI` in env for production.
- `sharp` may need Alpine build tools or glibc in some environments.

## Support & ownership

- Maintainers: <!-- TODO: confirm -->
- Communication: <!-- TODO: confirm channel (Slack/Email) -->
