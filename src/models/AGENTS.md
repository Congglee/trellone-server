# Models - Agent Guide

## Package Identity

Data layer for Trellone API. Contains MongoDB schemas (with TypeScript interfaces and classes), request/response type definitions, and error classes. Dual interface + class pattern for schemas.

## Setup & Run

Models are imported and used in services and controllers. No separate build step needed.

```typescript
import Board from '~/models/schemas/Board.schema'
import { CreateBoardReqBody } from '~/models/requests/Board.requests'
import { ErrorWithStatus } from '~/models/Errors'
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
import { ObjectId } from 'mongodb'

// Interface
interface UserSchema {
  _id?: ObjectId
  email: string
  password: string
  username: string
  display_name: string
  avatar?: string
  is_active?: boolean
  email_verify_token?: string
  forgot_password_token?: string
  verify?: UserVerifyStatus
  auth_providers?: string[]
  is_password_login_enabled?: boolean
  google_id?: string
  _destroy?: boolean
  created_at?: Date
  updated_at?: Date
}

// Class
export default class User {
  _id?: ObjectId
  email: string
  password: string
  username: string
  display_name: string
  avatar: string
  is_active: boolean
  email_verify_token: string
  forgot_password_token: string
  verify: UserVerifyStatus
  auth_providers: string[]
  is_password_login_enabled: boolean
  google_id: string
  _destroy: boolean
  created_at?: Date
  updated_at?: Date

  constructor(user: UserSchema) {
    const date = new Date()

    this._id = user._id
    this.email = user.email
    this.password = user.password
    this.username = user.username
    this.display_name = user.display_name || ''
    this.avatar = user.avatar || ''
    this.is_active = user.is_active || true
    this.email_verify_token = user.email_verify_token || ''
    this.forgot_password_token = user.forgot_password_token || ''
    this.verify = user.verify || UserVerifyStatus.Unverified
    this.auth_providers = user.auth_providers || ['password']
    this.is_password_login_enabled = user.is_password_login_enabled ?? true
    this.google_id = user.google_id || ''
    this._destroy = user._destroy || false
    this.created_at = user.created_at || date
    this.updated_at = user.updated_at || date
  }
}
```

### Interface Design

✅ **DO**: Mark `_id` as optional (MongoDB generates it)

```typescript
interface BoardSchema {
  _id?: ObjectId
  // other fields
}
```

✅ **DO**: Use optional fields for constructor parameters with defaults

```typescript
interface BoardSchema {
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

✅ **DO**: Apply default values using logical OR or nullish coalescing

```typescript
this.title = board.title || ''
this.description = board.description || ''
this._destroy = board._destroy || false
// Use ?? for booleans that can be false
this.is_password_login_enabled = board.is_password_login_enabled ?? true
```

### Default Value Management

✅ **DO**: Use meaningful defaults

- Strings: `''` (empty string)
- Booleans: Use `||` for false as default, `??` for true as default
- Arrays: `[]` (empty array)
- Objects: `null` for optional references
- Dates: Current date for `created_at` and `updated_at`
- Enums: Default enum value (e.g., `UserVerifyStatus.Unverified`)

### Soft Delete

✅ **DO**: Include `_destroy` flag in all schemas

```typescript
_destroy?: boolean

// In constructor
this._destroy = board._destroy || false
```

✅ **DO**: Always check `_destroy: false` in queries (when needed)

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
import { ParamsDictionary } from 'express-serve-static-core'

export interface CreateBoardReqBody {
  title: string
  description?: string
  workspace_id: string
  visibility: BoardVisibility
  cover_photo?: string
}

export interface UpdateBoardReqBody {
  title?: string
  description?: string
  visibility?: BoardVisibility
  workspace_id?: string
  column_order_ids?: string[]
  cover_photo?: string
  background_color?: string
}

export interface BoardParams extends ParamsDictionary {
  board_id: string
}
```

✅ **DO**: Define token payload types

```typescript
// User.requests.ts
export interface TokenPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  iat: number
  exp: number
}
```

### Extension Types

✅ **DO**: Define reusable nested types in `Extensions.ts`

```typescript
// models/Extensions.ts
import { ObjectId } from 'mongodb'
import { BoardRole, WorkspaceRole } from '~/constants/enums'

export interface BoardMember {
  user_id: ObjectId
  role: BoardRole
  joined_at: Date
}

export interface WorkspaceMember {
  user_id: ObjectId
  role: WorkspaceRole
  joined_at: Date
}

export interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
  locale: string
}

export interface GoogleTokens {
  id_token: string
  access_token: string
}
```

✅ **DO**: Import extension types in schemas

```typescript
import { BoardMember } from '~/models/Extensions'

interface BoardSchema {
  members?: BoardMember[]
}
```

### Error Classes

✅ **DO**: Use ErrorWithStatus for HTTP errors (in Middleware only)

```typescript
// models/Errors.ts
import HTTP_STATUS from '~/constants/http-status'

export class ErrorWithStatus {
  message: string
  status: number
  error_code?: string

  constructor({ message, status, error_code }: { message: string; status: number; error_code?: string }) {
    this.message = message
    this.status = status
    this.error_code = error_code
  }
}

export class EntityError extends ErrorWithStatus {
  errors: ErrorsType

  constructor({ message = COMMON_MESSAGES.VALIDATION_ERROR, errors }: { message?: string; errors: ErrorsType }) {
    super({ message, status: HTTP_STATUS.UNPROCESSABLE_ENTITY })
    this.errors = errors
  }
}
```

## Touch Points / Key Files

- **Schemas Directory**: `src/models/schemas/` - All MongoDB schemas
  - `Board.schema.ts` - Board entity
  - `Card.schema.ts` - Card entity
  - `Column.schema.ts` - Column entity
  - `User.schema.ts` - User entity (with auth_providers, google_id)
  - `Workspace.schema.ts` - Workspace entity
  - `Invitation.schema.ts` - Invitation entity
  - `RefreshToken.schema.ts` - Refresh token entity
- **Request Types**: `src/models/requests/` - API request/response types
  - `User.requests.ts` - Auth and user request types (TokenPayload)
  - `Board.requests.ts` - Board request types
  - `Card.requests.ts` - Card request types
  - `Column.requests.ts` - Column request types
  - `Workspace.requests.ts` - Workspace request types
  - `Invitation.requests.ts` - Invitation request types
  - `Media.requests.ts` - Media request types
  - `Common.requests.ts` - Shared request types
- **Extensions**: `src/models/Extensions.ts` - Reusable nested types
- **Errors**: `src/models/Errors.ts` - ErrorWithStatus, EntityError classes

## JIT Index Hints

```bash
# Find a schema class
rg -n "export default class" src/models/schemas

# Find a schema interface
rg -n "interface.*Schema" src/models/schemas

# Find request types
rg -n "export interface.*ReqBody|export interface.*ReqParams" src/models/requests

# Find extension types
rg -n "export interface" src/models/Extensions.ts

# Find error classes
rg -n "export class.*Error" src/models/Errors.ts
```

## Common Gotchas

- **Dual pattern required** - Always define both interface and class
- **Default export for classes** - Export schema class as default
- **ObjectId type** - Use `ObjectId` not `string` for ID fields in schemas
- **Soft delete** - Always include `_destroy` flag
- **Default values** - Set in constructor, not in interface
- **Boolean defaults** - Use `??` for booleans that should default to true
- **Error classes** - ErrorWithStatus used only in Middleware layer

## Pre-PR Checks

```bash
# Type check models
npm run build

# Verify schema pattern
rg -n "export default class" src/models/schemas
```
