# Models - Agent Guide

## Package Identity

Data layer for Trellone API. Contains MongoDB schemas (with TypeScript interfaces and classes) and request/response type definitions. Dual interface + class pattern for schemas.

## Setup & Run

Models are imported and used in services and controllers. No separate build step needed.

```typescript
import Board from '~/models/schemas/Board.schema'
import { CreateBoardReqBody } from '~/models/requests/Board.requests'
```

## Patterns & Conventions

### File Organization

- **Schemas**: `src/models/schemas/` - Database schema definitions
- **Request Types**: `src/models/requests/` - API request/response types
- **Extensions**: `src/models/Extensions.ts` - Reusable nested types
- **Errors**: `src/models/Errors.ts` - Custom error classes

✅ **DO**: Follow `src/models/schemas/Board.schema.ts` pattern
- Define interface first (`BoardSchema`)
- Implement class with constructor (`Board`)
- Export class as default

### Schema Definition Architecture

✅ **DO**: Use dual interface + class pattern
```typescript
// Interface
export interface BoardSchema {
  _id?: ObjectId
  title: string
  description?: string
  workspace_id: ObjectId
  created_at?: Date
  updated_at?: Date
  _destroy?: boolean
}

// Class
export default class Board implements BoardSchema {
  _id?: ObjectId
  title: string
  description: string
  workspace_id: ObjectId
  created_at: Date
  updated_at: Date
  _destroy: boolean

  constructor(board: BoardSchema) {
    const date = new Date()
    this._id = board._id
    this.title = board.title || ''
    this.description = board.description || ''
    this.workspace_id = board.workspace_id
    this.created_at = board.created_at || date
    this.updated_at = board.updated_at || date
    this._destroy = board._destroy || false
  }
}
```

### Interface Design

✅ **DO**: Mark `_id` as optional (MongoDB generates it)
```typescript
export interface BoardSchema {
  _id?: ObjectId
  // other fields
}
```

✅ **DO**: Use optional fields for constructor parameters with defaults
```typescript
export interface BoardSchema {
  title?: string  // Has default in constructor
  description?: string  // Has default in constructor
}
```

✅ **DO**: Import ObjectId from 'mongodb'
```typescript
import { ObjectId } from 'mongodb'
```

### Class Implementation

✅ **DO**: Use single parameter object in constructor
```typescript
constructor(board: BoardSchema) {
  // implementation
}
```

✅ **DO**: Create single date variable for timestamps
```typescript
const date = new Date()
this.created_at = board.created_at || date
this.updated_at = board.updated_at || date
```

✅ **DO**: Apply default values using logical OR
```typescript
this.title = board.title || ''
this.description = board.description || ''
this._destroy = board._destroy || false
```

### Default Value Management

✅ **DO**: Use meaningful defaults
- Strings: `''` (empty string)
- Booleans: `false` for flags, `true` for active states
- Arrays: `[]` (empty array)
- Objects: `null` for optional references
- Dates: Current date for `created_at` and `updated_at`

### Soft Delete

✅ **DO**: Include `_destroy` flag in all schemas
```typescript
_destroy?: boolean

// In constructor
this._destroy = board._destroy || false
```

✅ **DO**: Always check `_destroy: false` in queries
```typescript
await databaseService.boards.findOne({
  _id: new ObjectId(board_id),
  _destroy: false
})
```

### Request Types

✅ **DO**: Define request types in `models/requests/`
```typescript
// Board.requests.ts
export interface CreateBoardReqBody {
  title: string
  description?: string
  workspace_id: string
  type: BoardType
}

export interface UpdateBoardReqBody {
  title?: string
  description?: string
}
```

✅ **DO**: Export allowed fields arrays for middleware
```typescript
export const CREATE_BOARD_ALLOWED_FIELDS = [
  'title',
  'description',
  'workspace_id',
  'type',
  'cover_photo'
] as const
```

✅ **DO**: Define parameter types for route params
```typescript
export interface BoardParams extends ParamsDictionary {
  board_id: string
}
```

### Extension Types

✅ **DO**: Define reusable nested types in `Extensions.ts`
```typescript
// models/Extensions.ts
export interface BoardMember {
  user_id: ObjectId
  role: BoardRole
  joined_at: Date
}
```

✅ **DO**: Import extension types in schemas
```typescript
import { BoardMember } from '~/models/Extensions'

export interface BoardSchema {
  members: BoardMember[]
}
```

## Touch Points / Key Files

- **Schemas Directory**: `src/models/schemas/` - All MongoDB schemas
  - `Board.schema.ts` - Board entity
  - `Card.schema.ts` - Card entity
  - `Column.schema.ts` - Column entity
  - `User.schema.ts` - User entity
  - `Workspace.schema.ts` - Workspace entity
  - `Invitation.schema.ts` - Invitation entity
  - `RefreshToken.schema.ts` - Refresh token entity
- **Request Types**: `src/models/requests/` - API request/response types
- **Extensions**: `src/models/Extensions.ts` - Reusable nested types
- **Errors**: `src/models/Errors.ts` - ErrorWithStatus class

## JIT Index Hints

```bash
# Find a schema class
rg -n "export default class.*implements" src/models/schemas

# Find a schema interface
rg -n "export interface.*Schema" src/models/schemas

# Find request types
rg -n "export interface.*ReqBody|export interface.*ReqParams" src/models/requests

# Find allowed fields arrays
rg -n "ALLOWED_FIELDS" src/models/requests
```

## Common Gotchas

- **Dual pattern required** - Always define both interface and class
- **Default export for classes** - Export schema class as default
- **ObjectId type** - Use `ObjectId` not `string` for ID fields
- **Soft delete** - Always include `_destroy` flag and check in queries
- **Default values** - Set in constructor, not in interface

## Pre-PR Checks

```bash
# Type check models
npm run build

# Verify schema pattern
rg -n "export default class.*implements" src/models/schemas
```

