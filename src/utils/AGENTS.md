# Utils - Agent Guide

## Package Identity

Utility functions for Trellone API. Pure functions for common operations like validation, error handling, JWT management, socket initialization, RBAC, and data manipulation.

## Setup & Run

Utils are imported directly. No separate build step needed.

```typescript
import { validate } from '~/utils/validation'
import { hashPassword } from '~/utils/crypto'
import { wrapRequestHandler } from '~/utils/handlers'
import { signToken, verifyToken, verifyAccessToken } from '~/utils/jwt'
import initSocket from '~/utils/socket'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each utility domain has its own file
- **Naming**: Use kebab-case (e.g., `validation.ts`, `crypto.ts`)
- **Exports**: Named exports for individual functions, default export for `socket.ts`

✅ **DO**: Follow `src/utils/validation.ts` pattern

- Export individual utility functions
- Use explicit TypeScript types
- Keep functions pure (no side effects)

### Validation Utilities

✅ **DO**: Create validation wrapper for express-validator

```typescript
// utils/validation.ts
import express from 'express'
import { validationResult, ValidationChain } from 'express-validator'
import { RunnableValidationChains } from 'express-validator/lib/middlewares/schema'
import HTTP_STATUS from '~/constants/http-status'
import { EntityError, ErrorWithStatus } from '~/models/Errors'

export const validate = (validation: RunnableValidationChains<ValidationChain>) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    await validation.run(req)

    const errors = validationResult(req)
    if (errors.isEmpty()) {
      return next()
    }

    const errorsObject = errors.mapped()
    const entityError = new EntityError({ errors: {} })

    for (const key in errorsObject) {
      const { msg } = errorsObject[key]

      // If error is ErrorWithStatus with non-422 status, pass it to error handler
      if (msg instanceof ErrorWithStatus && msg.status !== HTTP_STATUS.UNPROCESSABLE_ENTITY) {
        return next(msg)
      }

      entityError.errors[key] = errorsObject[key]
    }

    next(entityError)
  }
}
```

### Error Handling Utilities

✅ **DO**: Create error handler wrapper

```typescript
// utils/handlers.ts
import { NextFunction, Request, RequestHandler, Response } from 'express'

export const wrapRequestHandler = <P>(func: RequestHandler<P, any, any, any>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    try {
      await func(req, res, next)
    } catch (error) {
      next(error)
    }
  }
}
```

### JWT Utilities

✅ **DO**: Encapsulate JWT operations

```typescript
// utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/http-status'

export const signToken = ({
  payload,
  privateKey,
  options = { algorithm: 'HS256' }
}: {
  payload: string | Buffer | object
  privateKey: string
  options?: SignOptions
}) => {
  return new Promise<string>((resolve, reject) => {
    jwt.sign(payload, privateKey, options, (error, token) => {
      if (error) {
        throw reject(error)
      }
      resolve(token as string)
    })
  })
}

export const verifyToken = <T>({
  token,
  secretOrPublicKey
}: {
  token: string
  secretOrPublicKey: string
}) => {
  return new Promise<T>((resolve, reject) => {
    jwt.verify(token, secretOrPublicKey, (error, decoded) => {
      if (error) {
        throw reject(error)
      }
      resolve(decoded as T)
    })
  })
}

export const verifyAccessToken = async (access_token: string, req?: Request) => {
  if (!access_token) {
    throw new ErrorWithStatus({
      message: AUTH_MESSAGES.ACCESS_TOKEN_IS_REQUIRED,
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }

  try {
    const decoded_authorization = await verifyToken({
      token: access_token,
      secretOrPublicKey: envConfig.jwtSecretAccessToken as string
    })

    if (req) {
      req.decoded_authorization = decoded_authorization
      return true
    }

    return decoded_authorization
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ErrorWithStatus({
        message: capitalize(error.message),
        status: HTTP_STATUS.UNAUTHORIZED,
        error_code: AUTH_ERROR_CODES.TOKEN_EXPIRED
      })
    }

    throw new ErrorWithStatus({
      message: capitalize((error as JsonWebTokenError).message),
      status: HTTP_STATUS.UNAUTHORIZED
    })
  }
}
```

### Crypto Utilities

✅ **DO**: Use SHA256 for password hashing (with salt)

```typescript
// utils/crypto.ts
import { createHash } from 'crypto'
import { envConfig } from '~/config/environment'

export const hashPassword = (password: string) => {
  return createHash('sha256').update(password + envConfig.passwordSecret).digest('hex')
}
```

### Socket Utilities

✅ **DO**: Initialize Socket.IO server in `src/utils/socket.ts`

```typescript
// src/utils/socket.ts
import { Server as ServerHttp } from 'http'
import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'
import { TokenPayload } from '~/models/requests/User.requests'
import { verifyAccessToken } from '~/utils/jwt'

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    pingInterval: 20000,
    pingTimeout: 25000
  })

  // User tracking map
  const users: { [key: string]: { socket_id: string } } = {}

  // Authentication middleware
  io.use(async (socket, next) => {
    // Prefer cookie (HTTP-only), fall back to auth header
    const cookieHeader = socket.handshake.headers.cookie
    let access_token: string | undefined

    if (cookieHeader) {
      const cookies: { [key: string]: string } = {}
      cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=')
        if (parts.length === 2) {
          cookies[parts[0].trim()] = parts[1].trim()
        }
      })
      access_token = cookies['access_token']
    }

    if (!access_token) {
      const authHeader = (socket.handshake.auth?.Authorization || '') as string
      if (authHeader.startsWith('Bearer ')) {
        access_token = authHeader.slice(7)
      }
    }

    if (!access_token) {
      return next(new Error('Unauthorized'))
    }

    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      socket.data.decoded_authorization = decoded_authorization
      socket.data.access_token = access_token
      return next()
    } catch (error) {
      return next(new Error('Unauthorized'))
    }
  })

  // Connection handler
  io.on('connection', (socket) => {
    const { user_id } = socket.data.decoded_authorization as TokenPayload
    users[user_id] = { socket_id: socket.id }

    // Error handling
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    // Register all socket event handlers
    inviteUserToWorkspaceSocket(io, socket, users)
    inviteUserToBoardSocket(io, socket, users)
    manageWorkspaceSocketEvents(io, socket)
    manageBoardSocketEvents(socket)
    updateWorkspaceSocket(io, socket)
    createWorkspaceBoardSocket(socket)
    updateBoardSocket(socket)
    acceptBoardInvitationSocket(socket)
    deleteBoardSocket(socket)
    updateCardSocket(socket)

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      delete users[user_id]
    })
  })
}

export default initSocket
```

### RBAC Utilities

✅ **DO**: Implement permission checking functions

```typescript
// utils/rbac.ts
import { ObjectId } from 'mongodb'
import { BoardPermission, WorkspacePermission } from '~/constants/permissions'
import { BoardRole, WorkspaceRole } from '~/constants/enums'
import Board from '~/models/schemas/Board.schema'
import Workspace from '~/models/schemas/Workspace.schema'

export const hasBoardPermission = (
  userId: ObjectId,
  board: Board,
  permission: BoardPermission,
  workspace?: Workspace | null
): boolean => {
  // Implementation checks user role in board.members
  // and permission mapping
}

export const hasWorkspacePermission = (
  userId: ObjectId,
  workspace: Workspace,
  permission: WorkspacePermission
): boolean => {
  // Implementation checks user role in workspace.members
  // and permission mapping
}
```

### Guard Utilities

✅ **DO**: Implement assertion functions for state checks

```typescript
// utils/guards.ts
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/http-status'
import { BOARDS_MESSAGES, CARDS_MESSAGES } from '~/constants/messages'
import Board from '~/models/schemas/Board.schema'
import Card from '~/models/schemas/Card.schema'

export const assertBoardIsOpen = (board: Board): void => {
  if (board._destroy) {
    throw new ErrorWithStatus({
      message: BOARDS_MESSAGES.BOARD_IS_CLOSED_REOPEN_REQUIRED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
}

export const assertCardIsOpen = (card: Card): void => {
  if (card._destroy) {
    throw new ErrorWithStatus({
      message: CARDS_MESSAGES.CARD_IS_ARCHIVED_REOPEN_REQUIRED,
      status: HTTP_STATUS.FORBIDDEN
    })
  }
}
```

### Type Guards

✅ **DO**: Create type guards for error checking

```typescript
// utils/guards.ts (or type-guards.ts)
import { ErrorWithStatus } from '~/models/Errors'

export const isErrorWithStatus = (error: unknown): error is ErrorWithStatus => {
  return error instanceof ErrorWithStatus
}
```

## Touch Points / Key Files

- **Validation**: `src/utils/validation.ts` - Express-validator wrapper
- **Handlers**: `src/utils/handlers.ts` - Request handler wrapper
- **Crypto**: `src/utils/crypto.ts` - Password hashing
- **JWT**: `src/utils/jwt.ts` - Token signing, verification, verifyAccessToken
- **Socket**: `src/utils/socket.ts` - Socket.IO server initialization with auth middleware
- **Commons**: `src/utils/commons.ts` - General utilities
- **RBAC**: `src/utils/rbac.ts` - Permission checking functions
- **Guards**: `src/utils/guards.ts` - Assertion functions, type guards
- **File**: `src/utils/file.ts` - File processing and folder initialization

## JIT Index Hints

```bash
# Find a utility function
rg -n "export const" src/utils

# Find validation utilities
rg -n "validate" src/utils

# Find error handling utilities
rg -n "wrapRequestHandler" src/utils

# Find JWT utilities
rg -n "signToken|verifyToken|verifyAccessToken" src/utils

# Find socket initialization
rg -n "initSocket|export default initSocket" src/utils/socket.ts

# Find socket authentication middleware
rg -n "io\.use" src/utils/socket.ts

# Find RBAC utilities
rg -n "hasBoardPermission|hasWorkspacePermission" src/utils/rbac.ts
```

## Common Gotchas

- **Named exports** - Use named exports for most utilities
- **Default export** - Only `socket.ts` uses default export
- **Pure functions** - Avoid side effects (no console.log, no mutations)
- **Type safety** - Always use explicit TypeScript types
- **Error handling** - ErrorWithStatus used in JWT utils for auth errors
- **Async operations** - Use async/await consistently

## Pre-PR Checks

```bash
# Type check utils
npm run build

# Lint utils
npm run lint

# Verify functions are pure (no side effects)
rg -n "console\." src/utils
```
