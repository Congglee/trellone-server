# Trellone API - AI Agent Guide

## Project Snapshot

Trellone API is a TypeScript Express backend for Trello-style collaboration. Built with Express.js, MongoDB, Socket.IO, and TypeScript. Single project structure (not monorepo). Each `src/` subdirectory has its own detailed AGENTS.md file.

**Tech Stack**: Node.js, Express 4.21.2, TypeScript 5.8.2, MongoDB 6.14.2, Socket.IO 4.8.1

## Root Setup Commands

```bash
# Install dependencies
npm install

# Development server (with hot reload)
npm run dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Type checking (via build)
npm run build

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run prettier
npm run prettier:fix
```

## Universal Conventions

- **Code Style**: TypeScript strict mode, ESLint 9.22.0, Prettier
- **Import Paths**: Use `~` alias for `src/` directory (e.g., `import Service from '~/services/Service'`)
- **File Naming**:
  - Routes: `{feature}.routes.ts` (kebab-case)
  - Controllers: `{feature}.controllers.ts` (kebab-case)
  - Services: `{feature}.services.ts` (kebab-case)
  - Middlewares: `{feature}.middlewares.ts` (kebab-case)
  - Schemas: `{Entity}.schema.ts` (PascalCase for entity)
  - Request Types: `{Entity}.requests.ts` (PascalCase for entity)
- **Architecture Flow**: Routes → Middlewares → Controllers → Services → Database
- **Type Imports**: Use `import type` for type-only imports

## Security & Secrets

- Never commit `.env` files or API keys
- Environment variables loaded via `dotenv` and validated in `src/config/environment.ts`
- JWT tokens stored in httpOnly cookies
- Never log sensitive data (passwords, tokens) to console
- Use `ErrorWithStatus` for HTTP-specific errors

## JIT Index - Directory Map

### Source Structure (`src/`)

Each directory has detailed patterns in its own AGENTS.md:

- **Routes**: `src/routes/` → [see src/routes/AGENTS.md](src/routes/AGENTS.md)
- **Middlewares**: `src/middlewares/` → [see src/middlewares/AGENTS.md](src/middlewares/AGENTS.md)
- **Controllers**: `src/controllers/` → [see src/controllers/AGENTS.md](src/controllers/AGENTS.md)
- **Services**: `src/services/` → [see src/services/AGENTS.md](src/services/AGENTS.md)
- **Models**: `src/models/` → [see src/models/AGENTS.md](src/models/AGENTS.md)
- **Utils**: `src/utils/` → [see src/utils/AGENTS.md](src/utils/AGENTS.md)
- **Config**: `src/config/` → [see src/config/AGENTS.md](src/config/AGENTS.md)
- **Constants**: `src/constants/` → [see src/constants/AGENTS.md](src/constants/AGENTS.md)
- **Providers**: `src/providers/` → [see src/providers/AGENTS.md](src/providers/AGENTS.md)
- **Sockets**: `src/sockets/` → [see src/sockets/AGENTS.md](src/sockets/AGENTS.md)

### Quick Find Commands

```bash
# Find a route definition
rg -n "Router\(\)|\.(get|post|put|patch|delete)" src/routes

# Find a controller function
rg -n "export const.*Controller" src/controllers

# Find a service method
rg -n "async.*\(.*\)" src/services

# Find a middleware validator
rg -n "export const.*Validator" src/middlewares

# Find a MongoDB schema
rg -n "export default class.*extends" src/models/schemas

# Find a request type
rg -n "export interface.*ReqBody|export interface.*ReqParams" src/models/requests
```

## Definition of Done

Before creating a PR:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatting applied (`npm run prettier:fix`)
- [ ] Follows patterns from relevant `src/*/AGENTS.md` file
- [ ] Uses `~` alias for imports (not relative `../../`)
- [ ] All routes wrapped with `wrapRequestHandler`
- [ ] Proper error handling with `ErrorWithStatus`
- [ ] Request validation using express-validator
- [ ] Body filtering applied before controllers
