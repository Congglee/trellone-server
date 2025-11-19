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

## Error Handling Policy

**CRITICAL**: All error handling must be centralized. See [`.cursor/rules/centralized-error-handling.mdc`](.cursor/rules/centralized-error-handling.mdc) for full details.

### Core Rules

1. **No try-catch in Controllers or Services**:

   - ❌ **Strictly Prohibited**: Do NOT use `try-catch` blocks inside Controllers or Services
   - ❌ **Strictly Prohibited**: Do NOT handle errors or send error responses directly in these layers

2. **Separation of Concerns**:

   - **Middleware Layer**: MUST handle all validation, pre-checks, and throw `ErrorWithStatus` for HTTP errors
   - **Service Layer**: MUST focus ONLY on business logic (CRUD, calculations)
     - ❌ **Prohibited**: Do NOT throw `ErrorWithStatus` or perform validation in Services
     - ✅ **Assume**: Input is valid and pre-checked by Middleware
   - **Controller Layer**: Acts as a bridge - calls Service and returns response

3. **Error Flow**:
   - Errors thrown in Middleware/Controller/Services are caught by `wrapRequestHandler`
   - `wrapRequestHandler` forwards errors to global error handler (`src/middlewares/error.middlewares.ts`)
   - Global handler formats and sends HTTP response

### Examples

✅ **GOOD - Middleware handles validation**:

```typescript
// src/middlewares/user.middlewares.ts
export const registerValidator = validate(
  checkSchema({
    email: {
      custom: {
        options: async (value) => {
          const user = await databaseService.users.findOne({ email: value })
          if (user) {
            throw new Error('Email already exists') // Caught by validate wrapper
          }
          return true
        }
      }
    }
  })
)
```

✅ **GOOD - Service is pure logic**:

```typescript
// src/services/user.services.ts
export const register = async (payload: RegisterReqBody) => {
  // Pure logic: Just execute. Validation guaranteed by Middleware.
  return await databaseService.users.insertOne(payload)
}
```

✅ **GOOD - Controller is a bridge**:

```typescript
// src/controllers/user.controller.ts
export const registerController = wrapRequestHandler(async (req, res) => {
  const result = await userService.register(req.body)
  return res.json({ message: 'Success', result })
})
```

❌ **BAD - Service throwing HTTP errors**:

```typescript
// ❌ VIOLATION: Service should not throw HTTP errors
export const register = async (payload: RegisterReqBody) => {
  const exist = await db.users.findOne({ email: payload.email })
  if (exist) {
    throw new ErrorWithStatus({ message: 'Email already exists', status: 422 })
  }
  return await db.users.insertOne(payload)
}
```

## Security & Secrets

- Never commit `.env` files or API keys
- Environment variables loaded via `dotenv` and validated in `src/config/environment.ts`
- JWT tokens stored in httpOnly cookies with secure, sameSite: 'none' settings
- Access tokens and refresh tokens both set as httpOnly cookies on login/OAuth
- Refresh tokens stored in database for validation and revocation
- Never log sensitive data (passwords, tokens) to console
- Use `ErrorWithStatus` for HTTP-specific errors (only in Middleware layer, see Error Handling Policy)
- Password hashing uses bcrypt with salt rounds

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

# Find ErrorWithStatus usage (should only be in middlewares/utils)
rg -n "ErrorWithStatus" src

# Find try-catch blocks (should NOT be in controllers/services)
rg -n "try\s*\{" src/controllers src/services
```

### Project Rules

- **Centralized Error Handling**: [`.cursor/rules/centralized-error-handling.mdc`](.cursor/rules/centralized-error-handling.mdc) - Enforces no try-catch in Controllers/Services

## Definition of Done

Before creating a PR:

- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] ESLint passes (`npm run lint`)
- [ ] Prettier formatting applied (`npm run prettier:fix`)
- [ ] Follows patterns from relevant `src/*/AGENTS.md` file
- [ ] Uses `~` alias for imports (not relative `../../`)
- [ ] All routes wrapped with `wrapRequestHandler`
- [ ] No try-catch blocks in Controllers or Services (see Error Handling Policy)
- [ ] Validation and error throwing done in Middleware layer only
- [ ] Services contain pure business logic only (no validation, no ErrorWithStatus)
- [ ] Request validation using express-validator
- [ ] Body filtering applied before controllers
