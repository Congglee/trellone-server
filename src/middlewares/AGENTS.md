# Middlewares - Agent Guide

## Package Identity

Request validation and processing middleware for Trellone. Handles authentication, input validation, resource validation, permission checking, and body filtering. Uses express-validator for validation.

**CRITICAL**: Middleware is the ONLY layer that should perform validation and throw `ErrorWithStatus`. See [centralized-error-handling.mdc](../../.cursor/rules/centralized-error-handling.mdc).

## Setup & Run

Middlewares are imported and used in routes. No separate build step needed.

```typescript
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { createBoardValidator, boardIdValidator } from '~/middlewares/boards.middlewares'
import { requireBoardPermission } from '~/middlewares/rbac.middlewares'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own middleware file (e.g., `boards.middlewares.ts`, `auth.middlewares.ts`)
- **Common middlewares**: `common.middlewares.ts` - Shared utilities (pagination, filtering)
- **Error middlewares**: `error.middlewares.ts` - Global error handling
- **RBAC middlewares**: `rbac.middlewares.ts` - Permission checking
- **Naming**: Use kebab-case with `.middlewares.ts` suffix

✅ **DO**: Follow `src/middlewares/boards.middlewares.ts` pattern

- Export named validator functions
- Use express-validator with `checkSchema`
- Wrap validators with `validate` utility

### Validation Middleware Patterns

✅ **DO**: Use `express-validator` with `checkSchema`

```typescript
import { checkSchema } from 'express-validator'
import { validate } from '~/utils/validation'

export const createBoardValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 1, max: 50 },
          errorMessage: BOARDS_MESSAGES.BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_1_AND_50
        }
      }
    },
    ['body']
  )
)
```

✅ **DO**: Wrap validators with `validate` utility

```typescript
import { validate } from '~/utils/validation'

export const createBoardValidator = validate(checkSchema({...}, ['body']))
```

### Authentication Middleware

✅ **DO**: Use `accessTokenValidator` for protected routes

```typescript
import { accessTokenValidator } from '~/middlewares/auth.middlewares'

// Token extracted from cookies first, then Authorization header
// Decoded token stored in req.decoded_authorization
```

✅ **DO**: Access token validator checks cookies first, then Authorization header

```typescript
export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: { errorMessage: AUTH_MESSAGES.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value, { req }) => {
            // Get token from cookies first (preferred for httpOnly cookies)
            const cookie_token = req.headers?.cookie
            if (cookie_token) {
              const cookieEntries = cookie_token.split('; ')
              const accessTokenEntry = cookieEntries.find((entry: string) =>
                entry.startsWith('access_token=')
              )
              if (accessTokenEntry) {
                const access_token = accessTokenEntry.split('=')[1]
                return await verifyAccessToken(access_token, req as Request)
              }
            }
            // Fallback to Authorization header
            return await verifyAccessToken(value, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)
```

✅ **DO**: Validate refresh token from cookies

```typescript
export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            // Get from body or cookies
            const refresh_token = value || req.cookies?.refresh_token

            if (!refresh_token) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            // Verify token and check database
            const [decoded_refresh_token, refresh_token_doc] = await Promise.all([
              verifyToken({ token: refresh_token, secretOrPublicKey: envConfig.jwtSecretRefreshToken }),
              databaseService.refreshTokens.findOne({ token: refresh_token })
            ])

            if (refresh_token_doc === null) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            req.decoded_refresh_token = decoded_refresh_token
            return true
          }
        }
      }
    },
    ['cookies', 'body']
  )
)
```

✅ **DO**: Validate login with password login enabled check

```typescript
export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })

            if (user === null) {
              throw new Error(AUTH_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            // Check if password login is enabled
            if (!user.is_password_login_enabled || !user.auth_providers.includes('password')) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.PASSWORD_LOGIN_NOT_ENABLED,
                status: HTTP_STATUS.BAD_REQUEST,
                error_code: AUTH_ERROR_CODES.PASSWORD_LOGIN_DISABLED
              })
            }

            // Verify password
            const hashedPassword = hashPassword(req.body.password)
            if (user.password !== hashedPassword) {
              throw new Error(AUTH_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            req.user = user
            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)
```

✅ **DO**: Use `verifiedUserValidator` for email verification

```typescript
import { verifiedUserValidator } from '~/middlewares/users.middlewares'

// Ensures user has verified email
```

### Resource Validation

✅ **DO**: Create resource-specific ID validators that attach resource to request

```typescript
export const boardIdValidator = validate(
  checkSchema(
    {
      board_id: {
        isMongoId: { errorMessage: BOARDS_MESSAGES.INVALID_BOARD_ID },
        custom: {
          options: async (value, { req }) => {
            const board = await databaseService.boards
              .aggregate([
                { $match: { _id: new ObjectId(value) } },
                // Join with workspace for RBAC context
                {
                  $lookup: {
                    from: envConfig.dbWorkspacesCollection,
                    localField: 'workspace_id',
                    foreignField: '_id',
                    as: 'workspace'
                  }
                },
                { $unwind: { path: '$workspace', preserveNullAndEmptyArrays: true } }
              ])
              .toArray()

            if (!board[0]) {
              throw new ErrorWithStatus({
                message: BOARDS_MESSAGES.BOARD_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).board = board[0]
            return true
          }
        }
      }
    },
    ['params']
  )
)
```

✅ **DO**: Attach validated resources to request object

```typescript
;(req as Request).board = board
;(req as Request).card = card
;(req as Request).workspace = workspace
```

### RBAC Middleware

✅ **DO**: Use RBAC middlewares for permission checking

```typescript
import { requireBoardPermission, requireWorkspacePermission } from '~/middlewares/rbac.middlewares'
import { BoardPermission, WorkspacePermission } from '~/constants/permissions'

// Single permission
requireBoardPermission(BoardPermission.ViewBoard)

// Multiple permissions (OR - any one permission is sufficient)
requireBoardPermission([
  BoardPermission.ManageBoard,
  BoardPermission.EditBoardInfo,
  BoardPermission.ChangeBoardBackground
])

// With options
requireBoardPermission(BoardPermission.ManageBoard, { allowClosed: true })
```

✅ **DO**: Use board state checks before permission checks

```typescript
import { ensureBoardOpen, ensureBoardClosed, requireBoardMembership } from '~/middlewares/boards.middlewares'

// Route for updating board (requires open board)
boardsRouter.put(
  '/:board_id',
  accessTokenValidator,
  verifiedUserValidator,
  boardIdValidator,
  ensureBoardOpen,
  requireBoardMembership,
  updateBoardValidator,
  requireBoardPermission(BoardPermission.ManageBoard),
  wrapRequestHandler(updateBoardController)
)

// Route for deleting board (requires closed board)
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
```

### Custom Validation

✅ **DO**: Use `custom` validators for business logic

```typescript
custom: {
  options: async (value) => {
    const workspace = await databaseService.workspaces.findOne({ _id: new ObjectId(value) })
    if (!workspace) {
      throw new Error(WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND)
    }
    return true
  }
}
```

✅ **DO**: Use `ErrorWithStatus` for HTTP-specific errors

```typescript
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/http-status'

throw new ErrorWithStatus({
  message: 'Resource not found',
  status: HTTP_STATUS.NOT_FOUND
})

// With error code for client handling
throw new ErrorWithStatus({
  message: AUTH_MESSAGES.PASSWORD_LOGIN_NOT_ENABLED,
  status: HTTP_STATUS.BAD_REQUEST,
  error_code: AUTH_ERROR_CODES.PASSWORD_LOGIN_DISABLED
})
```

### Body Filtering

✅ **DO**: Use `filterMiddleware` to whitelist allowed fields

```typescript
import { filterMiddleware } from '~/middlewares/common.middlewares'

filterMiddleware<UpdateBoardReqBody>([
  'title',
  'description',
  'visibility',
  'workspace_id',
  'column_order_ids',
  'cover_photo',
  'background_color'
])
```

### Pagination Validation

✅ **DO**: Use `paginationValidator` for list endpoints

```typescript
import { paginationValidator } from '~/middlewares/common.middlewares'

boardsRouter.get('/', accessTokenValidator, paginationValidator, getBoardsValidator, wrapRequestHandler(getBoardsController))
```

### Schema Reusability

✅ **DO**: Extract common validation schemas

```typescript
// In auth.middlewares.ts
export const passwordSchema: ParamSchema = {
  notEmpty: { errorMessage: AUTH_MESSAGES.PASSWORD_IS_REQUIRED },
  isString: { errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRING },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: AUTH_MESSAGES.PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_50
  },
  isStrongPassword: {
    options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

export const confirmPasswordSchema: ParamSchema = {
  // ... similar structure
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(AUTH_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}
```

## Touch Points / Key Files

- **Auth Middlewares**: `src/middlewares/auth.middlewares.ts` - Token validation, login, register, OAuth
- **Common Middlewares**: `src/middlewares/common.middlewares.ts` - Pagination, filtering
- **Error Middlewares**: `src/middlewares/error.middlewares.ts` - Global error handling
- **RBAC Middlewares**: `src/middlewares/rbac.middlewares.ts` - Permission checking
- **Boards Middlewares**: `src/middlewares/boards.middlewares.ts` - Board validation
- **Cards Middlewares**: `src/middlewares/cards.middlewares.ts` - Card validation
- **Columns Middlewares**: `src/middlewares/columns.middlewares.ts` - Column validation
- **Workspaces Middlewares**: `src/middlewares/workspaces.middlewares.ts` - Workspace validation
- **Users Middlewares**: `src/middlewares/users.middlewares.ts` - User validation
- **Invitations Middlewares**: `src/middlewares/invitations.middlewares.ts` - Invitation validation
- **Medias Middlewares**: `src/middlewares/medias.middlewares.ts` - Media upload validation
- **Validation Utility**: `src/utils/validation.ts` - `validate` wrapper function

## JIT Index Hints

```bash
# Find a validator function
rg -n "export const.*Validator" src/middlewares

# Find checkSchema usage
rg -n "checkSchema" src/middlewares

# Find custom validators
rg -n "custom:" src/middlewares

# Find resource validators
rg -n "IdValidator" src/middlewares

# Find RBAC middleware usage
rg -n "requireBoardPermission|requireWorkspacePermission" src

# Find ErrorWithStatus usage (should be in middlewares)
rg -n "ErrorWithStatus" src/middlewares
```

## Common Gotchas

- **Always wrap with validate** - Use `validate()` utility, not raw `checkSchema`
- **Request part specification** - Specify `['body']`, `['params']`, `['query']`, `['cookies']` in checkSchema
- **ErrorWithStatus required** - Use for HTTP-specific errors in custom validators
- **Resource attachment** - Attach validated resources to `req` object for controllers
- **Trim strings** - Always use `trim: true` for string fields
- **RBAC order** - Place permission checks after resource validators

## Pre-PR Checks

```bash
# Type check middlewares
npm run build

# Lint middlewares
npm run lint

# Verify validators are wrapped with validate
rg -n "export const.*Validator.*=.*validate" src/middlewares

# Find all ErrorWithStatus (should be primarily in middlewares)
rg -n "ErrorWithStatus" src
```
