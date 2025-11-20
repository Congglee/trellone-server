# Utils - Agent Guide

## Package Identity

Utility functions for Trellone API. Pure functions for common operations like validation, error handling, JWT management, and data manipulation.

## Setup & Run

Utils are imported directly. No separate build step needed.

```typescript
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'
import { wrapRequestHandler } from '~/utils/handlers'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each utility domain has its own file
- **Naming**: Use descriptive names in camelCase (e.g., `validation.ts`, `crypto.ts`)
- **Exports**: Named exports for individual functions

✅ **DO**: Follow `src/utils/validation.ts` pattern
- Export individual utility functions
- Use explicit TypeScript types
- Keep functions pure (no side effects)

### Function Structure

✅ **DO**: Use named exports
```typescript
export const validate = (validations: any[]) => {
  // implementation
}
```

✅ **DO**: Use explicit TypeScript types
```typescript
export const hashPassword = (password: string): Promise<string> => {
  // implementation
}
```

### Pure Functions

✅ **DO**: Keep functions pure (no side effects)
```typescript
// ✅ Good - pure function
export const formatDate = (date: Date): string => {
  return format(date, 'yyyy-MM-dd')
}

// ❌ Bad - side effect
export const formatDate = (date: Date): string => {
  console.log(date) // Side effect!
  return format(date, 'yyyy-MM-dd')
}
```

### Validation Utilities

✅ **DO**: Create validation wrapper for express-validator
```typescript
// utils/validation.ts
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)))
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(HTTP_STATUS.UNPROCESSABLE_ENTITY).json({
        message: errors.array()[0].msg
      })
    }
    next()
  }
}
```

### Error Handling Utilities

✅ **DO**: Create error handler wrapper
```typescript
// utils/handlers.ts
export const wrapRequestHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
```

### JWT Utilities

✅ **DO**: Encapsulate JWT operations
```typescript
// utils/jwt.ts
export const signToken = (payload: TokenPayload, secret: string, expiresIn: string): string => {
  return jwt.sign(payload, secret, { expiresIn })
}

export const verifyToken = (token: string, secret: string): TokenPayload => {
  return jwt.verify(token, secret) as TokenPayload
}
```

### Crypto Utilities

✅ **DO**: Use bcrypt for password hashing
```typescript
// utils/crypto.ts
import bcrypt from 'bcrypt'

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10)
}

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword)
}
```

### File Utilities

✅ **DO**: Handle file operations
```typescript
// utils/file.ts
export const validateFile = (file: File): void => {
  if (file.size > MAX_FILE_SIZE) {
    throw new ErrorWithStatus({
      message: 'File size exceeds limit',
      status: HTTP_STATUS.BAD_REQUEST
    })
  }
}
```

### Type Guards

✅ **DO**: Create type guards for error checking
```typescript
// utils/guards.ts
export const isErrorWithStatus = (error: unknown): error is ErrorWithStatus => {
  return error instanceof ErrorWithStatus
}
```

## Touch Points / Key Files

- **Validation**: `src/utils/validation.ts` - Express-validator wrapper
- **Handlers**: `src/utils/handlers.ts` - Request handler wrapper
- **Crypto**: `src/utils/crypto.ts` - Password hashing and security
- **JWT**: `src/utils/jwt.ts` - Token signing and verification
- **File**: `src/utils/file.ts` - File processing and validation
- **Commons**: `src/utils/commons.ts` - General utilities
- **Socket**: `src/utils/socket.ts` - Socket.IO server initialization and authentication middleware
- **RBAC**: `src/utils/rbac.ts` - Role-based access control utilities
- **Guards**: `src/utils/guards.ts` - Type guards

### Socket Utilities

✅ **DO**: Initialize Socket.IO server in `src/utils/socket.ts`
```typescript
// src/utils/socket.ts
import { Server as ServerHttp } from 'http'
import { Server } from 'socket.io'

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    pingInterval: 20000,
    pingTimeout: 25000
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    // Verify JWT token from cookie or auth header
    const access_token = getTokenFromCookieOrAuth(socket)
    const decoded = await verifyAccessToken(access_token)
    socket.data.decoded_authorization = decoded
    next()
  })

  // Connection handler
  io.on('connection', (socket) => {
    const { user_id } = socket.data.decoded_authorization
    users[user_id] = { socket_id: socket.id }

    // Register all event handlers
    manageBoardSocketEvents(socket)
    manageWorkspaceSocketEvents(io, socket)
    // ... other handlers

    socket.on('disconnect', () => {
      delete users[user_id]
    })
  })
}
```

✅ **DO**: Handle authentication in middleware (not in handlers)
- Prefer cookie-based token (from httpOnly cookie)
- Fall back to auth header if cookie not available
- Store decoded token in `socket.data.decoded_authorization`
- Track connected users in `users` map for targeted notifications

✅ **DO**: Configure Socket.IO for stability
- Set `pingInterval` and `pingTimeout` for connection health checks
- Enable CORS with proper configuration
- Consider WebSocket-only transport if infrastructure supports it

## JIT Index Hints

```bash
# Find a utility function
rg -n "export const" src/utils

# Find validation utilities
rg -n "validate|validator" src/utils

# Find error handling utilities
rg -n "ErrorWithStatus|wrapRequestHandler" src/utils

# Find JWT utilities
rg -n "signToken|verifyToken|verifyAccessToken" src/utils

# Find socket initialization
rg -n "initSocket|export default initSocket" src/utils/socket.ts

# Find socket authentication middleware
rg -n "io\.use" src/utils/socket.ts
```

## Common Gotchas

- **Named exports only** - Never use default exports for utilities
- **Pure functions** - Avoid side effects (no console.log, no mutations)
- **Type safety** - Always use explicit TypeScript types
- **Error handling** - Use `ErrorWithStatus` for HTTP-specific errors
- **Async operations** - Use async/await consistently

## Pre-PR Checks

```bash
# Type check utils
npm run build

# Lint utils
npm run lint

# Verify functions are pure (no side effects)
rg -n "console\.|process\.|global\." src/utils
```

