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
  wrapRequestHandler(createBoardController)
)

export default boardsRouter
```

### Middleware Chaining Order

✅ **DO**: Follow consistent middleware order

1. **Authentication**: `accessTokenValidator` (for protected routes)
2. **User Verification**: `verifiedUserValidator` (if email verification required)
3. **Resource Validation**: Feature-specific ID validators (e.g., `boardIdValidator`)
4. **State Checks**: `ensureBoardOpen`, `ensureBoardClosed`, `requireBoardMembership`
5. **Input Validation**: Feature-specific validators (e.g., `createBoardValidator`)
6. **Body Filtering**: `filterMiddleware<Type>([...fields])`
7. **Permission Checks**: `requireBoardPermission(...)`, `requireWorkspacePermission(...)`
8. **Controller**: Wrapped with `wrapRequestHandler`

### Authentication Routes

✅ **DO**: Define authentication routes without access token validator

```typescript
// Public routes (no authentication required)
authRouter.post('/register', registerValidator, wrapRequestHandler(registerController))
authRouter.post('/login', loginValidator, wrapRequestHandler(loginController))
authRouter.post('/logout', wrapRequestHandler(logoutController))
authRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))
authRouter.get('/oauth/google', OAuthValidator, wrapRequestHandler(OAuthController))
```

✅ **DO**: Use appropriate validators for each auth endpoint

```typescript
// Register: validate email uniqueness and password strength
authRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

// Login: validate credentials and check password login enabled
authRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

// Refresh token: validate refresh token from cookies
authRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

// OAuth: validate Google OAuth code and get user info
authRouter.get('/oauth/google', OAuthValidator, wrapRequestHandler(OAuthController))
```

### Protected Routes with RBAC

✅ **DO**: Apply authentication, resource validation, and permissions in order

```typescript
// View board
boardsRouter.get(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardPermission(BoardPermission.ViewBoard),
  wrapRequestHandler(getBoardController)
)

// Update board with multiple permissions
boardsRouter.put(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  ensureBoardOpen,
  requireBoardMembership,
  updateBoardValidator,
  filterMiddleware<UpdateBoardReqBody>([
    'title',
    'description',
    'visibility',
    'workspace_id',
    'column_order_ids',
    'cover_photo',
    'background_color'
  ]),
  requireBoardPermission([
    BoardPermission.ManageBoard,
    BoardPermission.EditBoardInfo,
    BoardPermission.ChangeBoardBackground,
    BoardPermission.ReorderColumn
  ]),
  wrapRequestHandler(updateBoardController)
)

// Archive board
boardsRouter.patch(
  '/:board_id/archive',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardMembership,
  ensureBoardOpen,
  requireBoardPermission(BoardPermission.ManageBoard),
  wrapRequestHandler(archiveBoardController)
)

// Delete board (requires closed board)
boardsRouter.delete(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardMembership,
  ensureBoardClosed,
  requireBoardPermission(BoardPermission.DeleteBoard),
  wrapRequestHandler(deleteBoardController)
)

// Reopen board (requires closed board, allowClosed option)
boardsRouter.patch(
  '/:board_id/reopen',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  requireBoardMembership,
  ensureBoardClosed,
  reopenBoardValidator,
  filterMiddleware<ReopenBoardReqBody>(['workspace_id']),
  requireBoardPermission(BoardPermission.ManageBoard, { allowClosed: true }),
  wrapRequestHandler(reopenBoardController)
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
import authRouter from '~/routes/auth.routes'
import usersRouter from '~/routes/users.routes'
import workspacesRouter from '~/routes/workspaces.routes'
import boardsRouter from '~/routes/boards.routes'
import columnsRouter from '~/routes/columns.routes'
import cardsRouter from '~/routes/cards.routes'
import mediasRouter from '~/routes/medias.routes'
import invitationsRouter from '~/routes/invitations.routes'

app.use('/auth', authRouter)
app.use('/users', usersRouter)
app.use('/workspaces', workspacesRouter)
app.use('/boards', boardsRouter)
app.use('/columns', columnsRouter)
app.use('/cards', cardsRouter)
app.use('/medias', mediasRouter)
app.use('/invitations', invitationsRouter)
```

### HTTP Method Conventions

✅ **DO**: Use appropriate HTTP methods

- **POST**: Create new resources (`POST /boards`)
- **GET**: Retrieve resources (`GET /boards/:board_id`)
- **PUT**: Update entire resources (`PUT /boards/:board_id`)
- **PATCH**: Partial updates or state changes (`PATCH /boards/:board_id/archive`)
- **DELETE**: Remove resources (`DELETE /cards/:card_id`)

### Body Filtering

✅ **DO**: Use `filterMiddleware` to whitelist allowed fields

```typescript
import { filterMiddleware } from '~/middlewares/common.middlewares'

filterMiddleware<UpdateBoardReqBody>([
  'title',
  'description',
  'visibility',
  'cover_photo'
])
```

### Import Order

✅ **DO**: Follow consistent import order

1. Express Router
2. Controllers
3. Middlewares (auth → feature-specific → common → rbac)
4. Types
5. Utils
6. Constants

```typescript
import { Router } from 'express'
import { createBoardController, getBoardController } from '~/controllers/boards.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { boardIdValidator, createBoardValidator } from '~/middlewares/boards.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { requireBoardPermission } from '~/middlewares/rbac.middlewares'
import { UpdateBoardReqBody } from '~/models/requests/Board.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { BoardPermission } from '~/constants/permissions'
```

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

# Find RBAC middleware usage
rg -n "requireBoardPermission|requireWorkspacePermission" src/routes

# Find wrapRequestHandler usage
rg -n "wrapRequestHandler" src/routes
```

## Common Gotchas

- **Middleware order matters** - Authentication must come first, RBAC after resource validation
- **Always wrap controllers** - Use `wrapRequestHandler` for error handling
- **Body filtering required** - Apply `filterMiddleware` before controllers
- **Import path alias** - Use `~` not relative paths
- **Route mounting** - Mount routes in `app.ts`, not in route files
- **State checks before permissions** - Use `ensureBoardOpen`/`ensureBoardClosed` before RBAC

## Pre-PR Checks

```bash
# Type check routes
npm run build

# Lint routes
npm run lint

# Verify routes are mounted in app.ts
rg -n "app\.use\(" src/app.ts

# Verify all controllers are wrapped
rg -n "wrapRequestHandler" src/routes
```
