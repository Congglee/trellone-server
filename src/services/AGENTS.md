# Services - Agent Guide

## Package Identity

Business logic layer for Trellone API. Contains all business logic, data transformation, and database operations. Class-based services with singleton pattern.

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
  private async validateBoardAccess(user_id: string, board_id: string) {
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
    { $lookup: { /* join with users */ } }
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

### Error Handling

✅ **DO**: Throw `ErrorWithStatus` for HTTP-specific errors
```typescript
import { ErrorWithStatus } from '~/models/Errors'

if (!board) {
  throw new ErrorWithStatus({
    message: BOARDS_MESSAGES.BOARD_NOT_FOUND,
    status: HTTP_STATUS.NOT_FOUND
  })
}
```

✅ **DO**: Let errors bubble up to controllers
```typescript
// No try-catch in services
// Errors caught by wrapRequestHandler in controllers
```

### Business Logic Encapsulation

✅ **DO**: Keep all business logic in services
```typescript
// ✅ Good - business logic in service
async updateBoard(board_id: string, updates: UpdateBoardReqBody) {
  // Validate permissions
  // Update board
  // Update related entities
  // Return updated board
}

// ❌ Bad - business logic in controller
```

✅ **DO**: Break complex operations into private helper methods
```typescript
class BoardsService {
  private async validateMemberAccess(user_id: string, board_id: string) {
    // validation logic
  }
  
  async addMember(board_id: string, user_id: string) {
    await this.validateMemberAccess(user_id, board_id)
    // add member logic
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

✅ **DO**: Avoid circular dependencies
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
  databaseService.users.find({ /* members query */ }).toArray(),
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

## JIT Index Hints

```bash
# Find a service class
rg -n "class.*Service" src/services

# Find database operations
rg -n "databaseService\." src/services

# Find ErrorWithStatus usage
rg -n "ErrorWithStatus" src/services

# Find aggregation pipelines
rg -n "aggregate\(\[" src/services
```

## Common Gotchas

- **Always use databaseService** - Never create direct MongoDB connections
- **ObjectId conversion** - Convert string IDs to ObjectId before queries
- **ErrorWithStatus required** - Use for HTTP-specific errors
- **No try-catch** - Let errors bubble up to controllers
- **Singleton pattern** - Export instance, not class

## Pre-PR Checks

```bash
# Type check services
npm run build

# Lint services
npm run lint

# Verify databaseService usage
rg -n "databaseService\." src/services
```

