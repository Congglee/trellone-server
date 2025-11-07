# Middlewares - Agent Guide

## Package Identity

Request validation and processing middleware for Trellone. Handles authentication, input validation, resource validation, and body filtering. Uses express-validator for validation.

## Setup & Run

Middlewares are imported and used in routes. No separate build step needed.

```typescript
import { accessTokenValidator, createBoardValidator } from '~/middlewares/boards.middlewares'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own middleware file (e.g., `boards.middlewares.ts`, `auth.middlewares.ts`)
- **Common middlewares**: `common.middlewares.ts` - Shared utilities (pagination, filtering)
- **Error middlewares**: `error.middlewares.ts` - Error handling
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
  checkSchema({
    title: {
      notEmpty: true,
      isString: true,
      trim: true,
      isLength: {
        options: { min: 1, max: 100 }
      },
      errorMessage: 'Title must be between 1 and 100 characters'
    }
  }, ['body'])
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

// Token extracted from cookies or Authorization header
// Decoded token stored in req.decoded_authorization
```

✅ **DO**: Use `verifiedUserValidator` for email verification
```typescript
import { verifiedUserValidator } from '~/middlewares/users.middlewares'

// Ensures user has verified email
```

### Resource Validation

✅ **DO**: Create resource-specific ID validators
```typescript
export const boardIdValidator = validate(
  checkSchema({
    board_id: {
      isMongoId: true,
      errorMessage: 'Invalid board ID'
    }
  }, ['params']),
  async (req, res, next) => {
    // Verify board exists and user has access
    const board = await databaseService.boards.findOne({ _id: new ObjectId(req.params.board_id) })
    if (!board) {
      throw new ErrorWithStatus({ message: 'Board not found', status: 404 })
    }
    req.board = board
    next()
  }
)
```

✅ **DO**: Attach validated resources to request object
```typescript
(req as Request).board = board
(req as Request).card = card
```

### Custom Validation

✅ **DO**: Use `custom` validators for business logic
```typescript
custom: {
  options: async (value) => {
    const workspace = await databaseService.workspaces.findOne({ _id: new ObjectId(value) })
    if (!workspace) {
      throw new Error('Workspace not found')
    }
    return true
  }
}
```

✅ **DO**: Use `ErrorWithStatus` for HTTP-specific errors
```typescript
import { ErrorWithStatus } from '~/models/Errors'

throw new ErrorWithStatus({ message: 'Resource not found', status: 404 })
```

### Body Filtering

✅ **DO**: Use `filterMiddleware` to whitelist allowed fields
```typescript
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { CREATE_BOARD_ALLOWED_FIELDS } from '~/models/requests/Board.requests'

filterMiddleware<CreateBoardReqBody>(CREATE_BOARD_ALLOWED_FIELDS)
```

### Pagination Validation

✅ **DO**: Use `paginationValidator` for list endpoints
```typescript
import { paginationValidator } from '~/middlewares/common.middlewares'

paginationValidator
```

### Schema Reusability

✅ **DO**: Extract common validation schemas
```typescript
// In common.middlewares.ts or feature file
export const passwordSchema = {
  notEmpty: true,
  isString: true,
  isLength: { options: { min: 8 } },
  errorMessage: 'Password must be at least 8 characters'
}
```

## Touch Points / Key Files

- **Auth Middlewares**: `src/middlewares/auth.middlewares.ts` - Token validation
- **Common Middlewares**: `src/middlewares/common.middlewares.ts` - Pagination, filtering
- **Error Middlewares**: `src/middlewares/error.middlewares.ts` - Error handling
- **Boards Middlewares**: `src/middlewares/boards.middlewares.ts` - Board validation
- **RBAC Middlewares**: `src/middlewares/rbac.middlewares.ts` - Permission checking
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
rg -n "IdValidator|.*Id.*Validator" src/middlewares
```

## Common Gotchas

- **Always wrap with validate** - Use `validate()` utility, not raw `checkSchema`
- **Request part specification** - Specify `['body']`, `['params']`, `['query']` in checkSchema
- **ErrorWithStatus required** - Use for HTTP-specific errors in custom validators
- **Resource attachment** - Attach validated resources to `req` object for controllers
- **Trim strings** - Always use `trim: true` for string fields

## Pre-PR Checks

```bash
# Type check middlewares
npm run build

# Lint middlewares
npm run lint

# Verify validators are wrapped with validate
rg -n "export const.*Validator.*=.*validate" src/middlewares
```

