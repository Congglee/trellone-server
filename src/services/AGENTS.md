# Services - Agent Guide

## Package Identity

Business logic layer for Trellone API. Contains all business logic, data transformation, and database operations. Class-based services with singleton pattern.

**CRITICAL**: Services are pure business logic only. See [centralized-error-handling.mdc](../../.cursor/rules/centralized-error-handling.mdc) for full policy.

## Setup & Run

Services are imported and used in controllers. No separate build step needed.

```typescript
import boardsService from '~/services/boards.services'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own service file (e.g., `boards.services.ts`, `auth.services.ts`)
- **Database service**: `database.services.ts` - Centralized MongoDB connection
- **Naming**: Use kebab-case with `.services.ts` suffix
- **Exports**: Default export of service instance

✅ **DO**: Follow `src/services/boards.services.ts` pattern

- Define ES6 class with descriptive name ending in "Service"
- Instantiate once and export as default
- Use `databaseService` for all database operations

### Class Structure

✅ **DO**: Use class-based architecture with singleton pattern

```typescript
class BoardsService {
  async createBoard(user_id: string, body: CreateBoardReqBody) {
    // implementation
  }
}

const boardsService = new BoardsService()
export default boardsService
```

✅ **DO**: Use `private` keyword for internal methods

```typescript
class BoardsService {
  private async calculateBoardStats(board_id: string) {
    // internal helper method
  }

  async getBoard(board_id: string) {
    // public method
  }
}
```

### Database Integration

✅ **DO**: Use `databaseService` for all database operations

```typescript
import databaseService from '~/services/database.services'

const result = await databaseService.boards.insertOne(newBoard)
const board = await databaseService.boards.findOne({ _id: boardId })
```

✅ **DO**: Use MongoDB aggregation for complex queries

```typescript
const boards = await databaseService.boards
  .aggregate([
    { $match: { workspace_id: new ObjectId(workspace_id) } },
    {
      $lookup: {
        /* join with users */
      }
    }
  ])
  .toArray()
```

✅ **DO**: Convert string IDs to ObjectId

```typescript
import { ObjectId } from 'mongodb'

const board = await databaseService.boards.findOne({
  _id: new ObjectId(board_id)
})
```

### Schema Usage

✅ **DO**: Use schema classes when creating new documents

```typescript
import Board from '~/models/schemas/Board.schema'

const newBoard = new Board({
  title: body.title,
  description: body.description,
  workspace_id: new ObjectId(body.workspace_id)
})

await databaseService.boards.insertOne(newBoard)
```

### Error Handling - CRITICAL POLICY

**⚠️ STRICTLY PROHIBITED**: Do NOT use try-catch blocks in Services

**⚠️ STRICTLY PROHIBITED**: Do NOT throw `ErrorWithStatus` or any HTTP-related errors in Services

**⚠️ STRICTLY PROHIBITED**: Do NOT perform validation checks in Services

✅ **DO**: Assume all input is valid (pre-checked by Middleware layer)

✅ **DO**: Let errors bubble up naturally to `wrapRequestHandler`

```typescript
// ✅ GOOD - Pure business logic, no validation
async createBoard(user_id: string, body: CreateBoardReqBody) {
  const board = new Board({
    ...body,
    workspace_id: new ObjectId(body.workspace_id),
    owner_id: new ObjectId(user_id)
  })

  await databaseService.boards.insertOne(board)
  return board
}
```

```typescript
// ❌ BAD - Service throwing HTTP errors (VIOLATION!)
async createBoard(user_id: string, body: CreateBoardReqBody) {
  const workspace = await databaseService.workspaces.findOne({ _id: new ObjectId(body.workspace_id) })
  if (!workspace) {
    // VIOLATION: This belongs in Middleware, not Service!
    throw new ErrorWithStatus({
      message: 'Workspace not found',
      status: HTTP_STATUS.NOT_FOUND
    })
  }
  // ...
}
```

```typescript
// ❌ BAD - Service using try-catch (VIOLATION!)
async getBoard(board_id: string) {
  try {
    const board = await databaseService.boards.findOne({ _id: new ObjectId(board_id) })
    return board
  } catch (error) {
    // VIOLATION: Error handling belongs in wrapRequestHandler!
    throw new ErrorWithStatus({ message: 'Error fetching board', status: 500 })
  }
}
```

### Validation Responsibility

| Responsibility             | Layer      | Example                                |
| -------------------------- | ---------- | -------------------------------------- |
| Input validation           | Middleware | `checkSchema({ title: { notEmpty } })` |
| Resource existence checks  | Middleware | `boardIdValidator` finds board         |
| Business constraint checks | Middleware | Check if user is member of board       |
| Permission checks          | Middleware | `requireBoardPermission(...)`          |
| Pure data operations       | Service    | Insert, update, delete, aggregate      |
| Data transformation        | Service    | Convert ObjectId to string             |

### Business Logic Encapsulation

✅ **DO**: Keep all business logic in services

```typescript
// ✅ Good - business logic in service
async updateBoard(board_id: string, updates: UpdateBoardReqBody) {
  // Pure update logic - validation already done by Middleware
  const result = await databaseService.boards.findOneAndUpdate(
    { _id: new ObjectId(board_id) },
    { $set: { ...updates, updated_at: new Date() } },
    { returnDocument: 'after' }
  )
  return result
}
```

✅ **DO**: Break complex operations into private helper methods

```typescript
class BoardsService {
  private buildBoardAggregation(options: GetBoardsOptions) {
    // Build aggregation pipeline
    return [{ $match: { workspace_id: new ObjectId(options.workspace_id) } }, { $lookup: { from: 'users' /* ... */ } }]
  }

  async getBoards(options: GetBoardsOptions) {
    const pipeline = this.buildBoardAggregation(options)
    return await databaseService.boards.aggregate(pipeline).toArray()
  }
}
```

### Service Interdependencies

✅ **DO**: Import and use other services when needed

```typescript
import usersService from '~/services/users.services'
import workspacesService from '~/services/workspaces.services'

// Use other services in methods
const user = await usersService.getUser(user_id)
```

❌ **DON'T**: Create circular dependencies

```typescript
// ❌ Bad - circular dependency
// boards.services.ts imports cards.services.ts
// cards.services.ts imports boards.services.ts
```

### Async Operations

✅ **DO**: Use `Promise.all()` for parallel operations

```typescript
const [board, members, columns] = await Promise.all([
  databaseService.boards.findOne({ _id: boardId }),
  databaseService.users
    .find({
      /* members query */
    })
    .toArray(),
  databaseService.columns.find({ board_id: boardId }).toArray()
])
```

### Data Transformation

✅ **DO**: Transform database documents in services

```typescript
// Convert ObjectId to string for API response
const board = await databaseService.boards.findOne({ _id: boardId })
return {
  ...board,
  _id: board._id.toString(),
  workspace_id: board.workspace_id.toString()
}
```

## Touch Points / Key Files

- **Database Service**: `src/services/database.services.ts` - MongoDB connection and collections
- **Auth Service**: `src/services/auth.services.ts` - Authentication and token management
- **Boards Service**: `src/services/boards.services.ts` - Board business logic
- **Cards Service**: `src/services/cards.services.ts` - Card operations
- **Columns Service**: `src/services/columns.services.ts` - Column management
- **Workspaces Service**: `src/services/workspaces.services.ts` - Workspace operations
- **Users Service**: `src/services/users.services.ts` - User management
- **Medias Service**: `src/services/medias.services.ts` - File processing
- **Invitations Service**: `src/services/invitations.services.ts` - Invitation handling

## Authentication Service Patterns

### Token Management

✅ **DO**: Use private methods for token signing

```typescript
class AuthService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.jwtSecretAccessToken as string,
      options: { expiresIn: envConfig.accessTokenExpiresIn }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp },
        privateKey: envConfig.jwtSecretRefreshToken as string
      })
    }
    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      privateKey: envConfig.jwtSecretRefreshToken as string,
      options: { expiresIn: envConfig.refreshTokenExpiresIn }
    })
  }
}
```

✅ **DO**: Store refresh tokens in database

```typescript
async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
  const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
    user_id: user_id.toString(),
    verify
  })

  const { iat, exp } = await this.decodeRefreshToken(refresh_token)

  await databaseService.refreshTokens.insertOne(
    new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
  )

  return { access_token, refresh_token }
}
```

✅ **DO**: Rotate refresh tokens on refresh

```typescript
async refreshToken({ user_id, verify, refresh_token }: { user_id: string; verify: UserVerifyStatus; refresh_token: string }) {
  const [new_access_token, new_refresh_token] = await Promise.all([
    this.signAccessToken({ user_id, verify }),
    this.signRefreshToken({ user_id, verify }),
    databaseService.refreshTokens.deleteOne({ token: refresh_token }) // Delete old token
  ])

  const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)

  await databaseService.refreshTokens.insertOne(
    new RefreshToken({
      user_id: new ObjectId(user_id),
      token: new_refresh_token,
      iat: decoded_refresh_token.iat,
      exp: decoded_refresh_token.exp
    })
  )

  return { access_token: new_access_token, refresh_token: new_refresh_token }
}
```

✅ **DO**: Handle OAuth user creation and linking

```typescript
async oauth(userInfo: GoogleUserInfo) {
  // Check for existing user by google_id or email
  let user = await databaseService.users.findOne({ google_id: userInfo.id })
  if (!user) {
    user = await databaseService.users.findOne({ email: userInfo.email })
  }

  if (user) {
    // Link Google account if not already linked
    if (!user.auth_providers.includes('google')) {
      await databaseService.users.updateOne(
        { _id: user._id },
        { $set: { auth_providers: [...user.auth_providers, 'google'], google_id: userInfo.id } }
      )
    }
    // Generate tokens for existing user
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user._id.toString(),
      verify: UserVerifyStatus.Verified
    })
    return { access_token, refresh_token, newUser: 0, verify: UserVerifyStatus.Verified }
  } else {
    // Create new user and generate tokens
    const user_id = new ObjectId()
    await databaseService.users.insertOne(
      new User({
        _id: user_id,
        email: userInfo.email,
        auth_providers: ['google'],
        google_id: userInfo.id,
        verify: UserVerifyStatus.Verified
        // ... other fields
      })
    )
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Verified
    })
    return { access_token, refresh_token, newUser: 1, verify: UserVerifyStatus.Verified }
  }
}
```

## JIT Index Hints

```bash
# Find a service class
rg -n "class.*Service" src/services

# Find database operations
rg -n "databaseService\." src/services

# Find aggregation pipelines
rg -n "aggregate\(\[" src/services

# Verify NO ErrorWithStatus in services (should return 0 results!)
rg -n "ErrorWithStatus" src/services

# Verify NO try-catch in services (should return 0 results!)
rg -n "try\s*\{" src/services
```

## Common Gotchas

- **NO ErrorWithStatus** - Services are pure business logic. Validation errors belong in Middleware
- **NO try-catch** - Let errors bubble up to `wrapRequestHandler`
- **NO validation** - Assume input is valid (pre-checked by Middleware)
- **Always use databaseService** - Never create direct MongoDB connections
- **ObjectId conversion** - Convert string IDs to ObjectId before queries
- **Singleton pattern** - Export instance, not class

## Pre-PR Checks

```bash
# Type check services
npm run build

# Lint services
npm run lint

# Verify NO ErrorWithStatus in services
rg -n "ErrorWithStatus" src/services

# Verify NO try-catch in services
rg -n "try\s*\{" src/services

# Verify databaseService usage
rg -n "databaseService\." src/services
```
