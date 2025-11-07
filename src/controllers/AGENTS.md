# Controllers - Agent Guide

## Package Identity

Request handlers for Trellone API. Extract request data, call services, and format responses. Thin layer between routes and services.

## Setup & Run

Controllers are imported and used in routes. No separate build step needed.

```typescript
import { createBoardController } from '~/controllers/boards.controllers'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own controller file (e.g., `boards.controllers.ts`, `auth.controllers.ts`)
- **Naming**: Use kebab-case with `.controllers.ts` suffix
- **Exports**: Named exports with pattern `{action}{Feature}Controller`

✅ **DO**: Follow `src/controllers/boards.controllers.ts` pattern
- Export named controller functions
- Use async/await for all operations
- Extract data → Call service → Format response

### Function Signature

✅ **DO**: Use async functions with Express Request/Response types
```typescript
import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

export const createBoardController = async (
  req: Request<ParamsDictionary, any, CreateBoardReqBody>,
  res: Response
) => {
  // implementation
}
```

✅ **DO**: Use TypeScript generics for type safety
```typescript
Request<ParamsType, any, BodyType, QueryType>
```

### Request Data Extraction

✅ **DO**: Extract user_id from decoded token
```typescript
const { user_id } = req.decoded_authorization as TokenPayload
```

✅ **DO**: Extract route parameters
```typescript
const { board_id } = req.params
```

✅ **DO**: Extract query parameters with type conversion
```typescript
const limit = Number(req.query.limit)
const page = Number(req.query.page)
```

✅ **DO**: Access middleware-attached resources
```typescript
const board = req.board as Board
const card = req.card as Card
```

### Response Formatting

✅ **DO**: Use standardized response format
```typescript
return res.json({
  message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS,
  result: board
})
```

✅ **DO**: Import messages from constants
```typescript
import { BOARDS_MESSAGES } from '~/constants/messages'
```

✅ **DO**: Include pagination metadata for list endpoints
```typescript
return res.json({
  message: BOARDS_MESSAGES.GET_BOARDS_SUCCESS,
  result: {
    items: boards,
    limit,
    page,
    total_page: Math.ceil(total / limit)
  }
})
```

### Service Layer Integration

✅ **DO**: Delegate all business logic to services
```typescript
const result = await boardsService.createBoard(user_id, req.body)
```

✅ **DO**: Pass extracted and validated data to services
```typescript
const result = await boardsService.getBoards({
  user_id,
  limit,
  page,
  keyword: req.query.keyword
})
```

### Error Handling

✅ **DO**: Let errors bubble up (handled by `wrapRequestHandler`)
```typescript
// No try-catch blocks in controllers
// Errors are caught by wrapRequestHandler wrapper
```

✅ **DO**: Use early returns for validation failures
```typescript
if (!board) {
  return res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Board not found' })
}
```

### Cookie Management

✅ **DO**: Set cookies with consistent security settings
```typescript
res.cookie('access_token', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: ms('7 days')
})
```

✅ **DO**: Clear cookies on logout
```typescript
res.clearCookie('access_token')
res.clearCookie('refresh_token')
```

## Touch Points / Key Files

- **Auth Controllers**: `src/controllers/auth.controllers.ts` - Login, register, OAuth
- **Boards Controllers**: `src/controllers/boards.controllers.ts` - Board CRUD operations
- **Cards Controllers**: `src/controllers/cards.controllers.ts` - Card operations
- **Columns Controllers**: `src/controllers/columns.controllers.ts` - Column management
- **Workspaces Controllers**: `src/controllers/workspaces.controllers.ts` - Workspace operations
- **Users Controllers**: `src/controllers/users.controllers.ts` - User management
- **Medias Controllers**: `src/controllers/medias.controllers.ts` - File uploads
- **Invitations Controllers**: `src/controllers/invitations.controllers.ts` - Invitation handling

## JIT Index Hints

```bash
# Find a controller function
rg -n "export const.*Controller" src/controllers

# Find service calls in controllers
rg -n "Service\." src/controllers

# Find response formatting
rg -n "res\.json\(|res\.status\(" src/controllers

# Find cookie management
rg -n "res\.cookie|res\.clearCookie" src/controllers
```

## Common Gotchas

- **No try-catch** - Errors handled by `wrapRequestHandler`, don't use try-catch
- **Type assertions** - Use `as TokenPayload` for decoded tokens
- **Service calls only** - Controllers should only call services, no business logic
- **Response format** - Always use `{ message, result }` format
- **Pagination calculation** - Use `Math.ceil(total / limit)` for total_page

## Pre-PR Checks

```bash
# Type check controllers
npm run build

# Lint controllers
npm run lint

# Verify controllers are wrapped in routes
rg -n "wrapRequestHandler.*Controller" src/routes
```

