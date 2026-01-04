# Controllers - Agent Guide

## Package Identity

Request handlers for Trellone API. Extract request data, call services, and format responses. Thin layer between routes and services.

**CRITICAL**: Controllers should NOT use try-catch. Errors bubble up to `wrapRequestHandler`. See [centralized-error-handling.mdc](../../.cursor/rules/centralized-error-handling.mdc).

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
const user = req.user as User
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

**⚠️ STRICTLY PROHIBITED**: Do NOT use try-catch blocks in Controllers

✅ **DO**: Let errors bubble up (handled by `wrapRequestHandler`)

```typescript
// ✅ GOOD - No try-catch, errors handled by wrapRequestHandler
export const createBoardController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await boardsService.createBoard(user_id, req.body)
  return res.json({ message: BOARDS_MESSAGES.CREATE_BOARD_SUCCESS, result })
}
```

```typescript
// ❌ BAD - Using try-catch (VIOLATION!)
export const createBoardController = async (req: Request, res: Response) => {
  try {
    const result = await boardsService.createBoard(req.body)
    return res.json({ result })
  } catch (error) {
    return res.status(500).json({ error: error.message })
  }
}
```

✅ **DO**: Use early returns for conditional responses (when middleware has validated)

```typescript
export const verifyEmailController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  // User not found handled by service/middleware, but if checking here:
  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: AUTH_MESSAGES.USER_NOT_FOUND
    })
  }

  // Email already verified - early return with success response
  if (user.email_verify_token === '') {
    return res.json({ message: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  const result = await authService.verifyEmail(user_id)
  return res.json(result)
}
```

### Cookie Management

✅ **DO**: Set cookies with consistent security settings

```typescript
res.cookie('access_token', result.access_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: ms('7 days')
})

res.cookie('refresh_token', result.refresh_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  maxAge: ms('7 days')
})
```

✅ **DO**: Set cookies on login

```typescript
export const loginController = async (req: Request, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId

  const result = await authService.login({ user_id: user_id.toString(), verify: user.verify })

  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  return res.json({ message: AUTH_MESSAGES.LOGIN_SUCCESS, result })
}
```

✅ **DO**: Update cookies on token refresh

```typescript
export const refreshTokenController = async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload

  const result = await authService.refreshToken({ user_id, verify, refresh_token, exp })

  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  return res.json({ message: AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS, result })
}
```

✅ **DO**: Clear cookies on logout

```typescript
export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies

  const result = await authService.logout(refresh_token)

  res.clearCookie('access_token')
  res.clearCookie('refresh_token')

  return res.json(result)
}
```

✅ **DO**: Handle OAuth redirect with tokens and cookies

```typescript
export const OAuthController = async (req: Request, res: Response) => {
  const googleUserInfo = req.google_user_info as GoogleUserInfo

  const result = await authService.oauth(googleUserInfo)

  // Build redirect URL with tokens for client-side storage
  const urlRedirect = `${envConfig.clientRedirectCallback}?access_token=${result.access_token}&refresh_token=${result.refresh_token}&new_user=${result.newUser}&verify=${result.verify}`

  // Set cookies for subsequent requests
  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  return res.redirect(urlRedirect)
}
```

## Touch Points / Key Files

- **Auth Controllers**: `src/controllers/auth.controllers.ts` - Login, register, OAuth, token refresh
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

# Verify NO try-catch in controllers (should return 0 results!)
rg -n "try\s*\{" src/controllers
```

## Common Gotchas

- **NO try-catch** - Errors handled by `wrapRequestHandler`, don't use try-catch
- **Type assertions** - Use `as TokenPayload` for decoded tokens
- **Service calls only** - Controllers should only call services, no business logic
- **Response format** - Always use `{ message, result }` format
- **Pagination calculation** - Use `Math.ceil(total / limit)` for total_page
- **Cookie settings** - Always use httpOnly, secure, sameSite: 'none' for cross-origin

## Pre-PR Checks

```bash
# Type check controllers
npm run build

# Lint controllers
npm run lint

# Verify NO try-catch in controllers
rg -n "try\s*\{" src/controllers

# Verify controllers are wrapped in routes
rg -n "wrapRequestHandler.*Controller" src/routes
```
