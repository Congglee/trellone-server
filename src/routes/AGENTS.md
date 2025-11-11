# Routes - Agent Guide

## Package Identity

API route definitions for Trellone. Express Router instances that define endpoints and middleware chains. Follows layered architecture: Routes → Middlewares → Controllers.

## Setup & Run

Routes are automatically loaded in `src/app.ts`. No separate build step needed.

```typescript
// Routes are mounted in app.ts
import boardsRouter from '~/routes/boards.routes'
app.use('/boards', boardsRouter)
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own route file (e.g., `boards.routes.ts`, `auth.routes.ts`)
- **Naming**: Use kebab-case with `.routes.ts` suffix
- **Exports**: Export default router instance

✅ **DO**: Follow `src/routes/boards.routes.ts` pattern
- Import Router from express
- Import controllers and middlewares
- Define routes with middleware chains
- Export default router

### Route Structure

✅ **DO**: Use Express Router instances
```typescript
import { Router } from 'express'
const boardsRouter = Router()

boardsRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createBoardValidator,
  filterMiddleware<CreateBoardReqBody>(CREATE_BOARD_ALLOWED_FIELDS),
  wrapRequestHandler(createBoardController)
)

export default boardsRouter
```

### Middleware Chaining Order

✅ **DO**: Follow consistent middleware order
1. **Authentication**: `accessTokenValidator` (for protected routes)
2. **User Verification**: `verifiedUserValidator` (if email verification required)
3. **Resource Validation**: Feature-specific ID validators (e.g., `boardIdValidator`)
4. **Input Validation**: Feature-specific validators (e.g., `createBoardValidator`)
5. **Body Filtering**: `filterMiddleware<Type>([...fields])`
6. **Controller**: Wrapped with `wrapRequestHandler`

✅ **DO**: Apply authentication first for protected routes
```typescript
boardsRouter.get(
  '/:board_id',
  accessTokenValidator,
  boardIdValidator,
  wrapRequestHandler(getBoardController)
)
```

✅ **DO**: Use `wrapRequestHandler` for all controllers
```typescript
wrapRequestHandler(createBoardController)
```

### Route Mounting

✅ **DO**: Mount routes in `app.ts` with clear prefixes
```typescript
// In app.ts
import boardsRouter from '~/routes/boards.routes'
app.use('/boards', boardsRouter)
```

✅ **DO**: Follow domain hierarchy
- `/workspaces` → `/boards` → `/columns` → `/cards`
- `/auth` for authentication
- `/medias` for file uploads
- `/invitations` for board invitations

### HTTP Method Conventions

✅ **DO**: Use appropriate HTTP methods
- **POST**: Create new resources (`POST /boards`)
- **GET**: Retrieve resources (`GET /boards/:board_id`)
- **PUT**: Update entire resources (`PUT /boards/:board_id`)
- **PATCH**: Partial updates (`PATCH /users/me`)
- **DELETE**: Remove resources (`DELETE /cards/:card_id`)

### Body Filtering

✅ **DO**: Use `filterMiddleware` to whitelist allowed fields
```typescript
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { CREATE_BOARD_ALLOWED_FIELDS } from '~/models/requests/Board.requests'

filterMiddleware<CreateBoardReqBody>(CREATE_BOARD_ALLOWED_FIELDS)
```

### Import Order

✅ **DO**: Follow consistent import order
1. Express Router
2. Controllers
3. Middlewares (auth → feature-specific → common)
4. Types
5. Utils

## Touch Points / Key Files

- **App Setup**: `src/app.ts` - Route mounting and middleware configuration
- **Auth Routes**: `src/routes/auth.routes.ts` - Authentication endpoints
- **Boards Routes**: `src/routes/boards.routes.ts` - Board management endpoints
- **Cards Routes**: `src/routes/cards.routes.ts` - Card operations endpoints
- **Columns Routes**: `src/routes/columns.routes.ts` - Column management endpoints
- **Workspaces Routes**: `src/routes/workspaces.routes.ts` - Workspace endpoints
- **Users Routes**: `src/routes/users.routes.ts` - User management endpoints
- **Medias Routes**: `src/routes/medias.routes.ts` - File upload endpoints
- **Invitations Routes**: `src/routes/invitations.routes.ts` - Invitation endpoints

## JIT Index Hints

```bash
# Find a route definition
rg -n "Router\(\)|\.(get|post|put|patch|delete)" src/routes

# Find route mounting in app.ts
rg -n "app\.use\(" src/app.ts

# Find middleware chains
rg -n "accessTokenValidator|verifiedUserValidator" src/routes

# Find filterMiddleware usage
rg -n "filterMiddleware" src/routes
```

## Common Gotchas

- **Middleware order matters** - Authentication must come first
- **Always wrap controllers** - Use `wrapRequestHandler` for error handling
- **Body filtering required** - Apply `filterMiddleware` before controllers
- **Import path alias** - Use `~` not relative paths
- **Route mounting** - Mount routes in `app.ts`, not in route files

## Pre-PR Checks

```bash
# Type check routes
npm run build

# Lint routes
npm run lint

# Verify routes are mounted in app.ts
rg -n "app\.use\(" src/app.ts
```

