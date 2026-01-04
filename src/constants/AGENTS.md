# Constants - Agent Guide

## Package Identity

Application constants for Trellone API. HTTP status codes, messages, enums, error codes, permissions, regex patterns, and domain URLs.

## Setup & Run

Constants are imported directly. No separate build step needed.

```typescript
import HTTP_STATUS from '~/constants/http-status'
import { BOARDS_MESSAGES, AUTH_MESSAGES } from '~/constants/messages'
import { BoardRole, BoardVisibility } from '~/constants/enums'
import { BoardPermission } from '~/constants/permissions'
import { AUTH_ERROR_CODES } from '~/constants/error-codes'
```

## Patterns & Conventions

### File Organization

- **HTTP Status**: `src/constants/http-status.ts` - HTTP status code constants
- **Messages**: `src/constants/messages.ts` - User-facing messages
- **Enums**: `src/constants/enums.ts` - Application enumerations
- **Permissions**: `src/constants/permissions.ts` - Permission constants for RBAC
- **Error Codes**: `src/constants/error-codes.ts` - Error code constants for client handling
- **Regex**: `src/constants/regex.ts` - Regular expression patterns
- **Domains**: `src/constants/domains.ts` - Domain URLs and constants

✅ **DO**: Follow `src/constants/http-status.ts` pattern

- Use const objects with `as const` for type safety
- Export as default for single-export files
- Use named exports for multiple constants

### HTTP Status Codes

✅ **DO**: Use HTTP_STATUS constants

```typescript
// constants/http-status.ts
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  PARTIAL_CONTENT: 206,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const

export default HTTP_STATUS
```

✅ **DO**: Import HTTP_STATUS as default

```typescript
import HTTP_STATUS from '~/constants/http-status'

res.status(HTTP_STATUS.NOT_FOUND).json({ message: 'Not found' })
```

### Enums

✅ **DO**: Use TypeScript enums for application constants

```typescript
// constants/enums.ts
export enum BoardVisibility {
  Public = 'Public',
  Private = 'Private'
}

export enum WorkspaceVisibility {
  Public = 'Public',
  Private = 'Private'
}

export enum WorkspaceRole {
  Admin = 'Admin',
  Normal = 'Normal'
}

export enum BoardRole {
  Admin = 'Admin',
  Member = 'Member',
  Observer = 'Observer'
}

export enum UserVerifyStatus {
  Unverified,
  Verified,
  Banned
}

export enum TokenType {
  AccessToken,
  RefreshToken,
  ForgotPasswordToken,
  EmailVerifyToken,
  InviteToken
}

export enum InvitationType {
  BoardInvitation = 'BOARD_INVITATION',
  WorkspaceInvitation = 'WORKSPACE_INVITATION'
}

export enum WorkspaceInvitationStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED'
}

export enum BoardInvitationStatus {
  Pending = 'PENDING',
  Accepted = 'ACCEPTED',
  Rejected = 'REJECTED'
}

export enum AttachmentType {
  File = 'FILE',
  Link = 'LINK'
}

export enum CardCommentReactionAction {
  Add = 'ADD',
  Remove = 'REMOVE'
}

export enum RoleLevel {
  Workspace = 'Workspace',
  Board = 'Board'
}
```

### Messages

✅ **DO**: Organize messages by feature domain

```typescript
// constants/messages.ts
export const COMMON_MESSAGES = {
  VALIDATION_ERROR: 'Validation error'
}

export const AUTH_MESSAGES = {
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_STRONG: 'Password must be 6-50 characters long and contain...',
  REGISTER_SUCCESS: 'Register successfully, please check your email to verify your account',
  LOGIN_SUCCESS: 'Login successfully',
  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  PASSWORD_LOGIN_NOT_ENABLED: 'This account currently uses Google login...'
} as const

export const BOARDS_MESSAGES = {
  BOARD_TITLE_IS_REQUIRED: 'Board title is required',
  CREATE_BOARD_SUCCESS: 'Board created successfully',
  BOARD_NOT_FOUND: 'Board not found',
  UPDATE_BOARD_SUCCESS: 'Board updated successfully'
} as const

// Similar patterns for:
// - USERS_MESSAGES
// - WORKSPACES_MESSAGES
// - COLUMNS_MESSAGES
// - CARDS_MESSAGES
// - MEDIAS_MESSAGES
// - INVITATIONS_MESSAGES
```

### Error Codes

✅ **DO**: Define error codes for client-side handling

```typescript
// constants/error-codes.ts
export const AUTH_ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  PASSWORD_LOGIN_DISABLED: 'PASSWORD_LOGIN_DISABLED'
} as const

export const BOARD_ERROR_CODES = {
  BOARD_ARCHIVED: 'BOARD_ARCHIVED'
} as const
```

✅ **DO**: Use error codes with ErrorWithStatus

```typescript
throw new ErrorWithStatus({
  message: AUTH_MESSAGES.PASSWORD_LOGIN_NOT_ENABLED,
  status: HTTP_STATUS.BAD_REQUEST,
  error_code: AUTH_ERROR_CODES.PASSWORD_LOGIN_DISABLED
})
```

### Permissions

✅ **DO**: Define permission constants for RBAC

```typescript
// constants/permissions.ts
export const BoardPermission = {
  ViewBoard: 'view_board',
  EditBoardInfo: 'edit_board_info',
  ManageBoard: 'manage_board',
  DeleteBoard: 'delete_board',
  ManageMembers: 'manage_members',
  ChangeBoardBackground: 'change_board_background',
  ReorderColumn: 'reorder_column',
  // ... more permissions
} as const

export type BoardPermission = (typeof BoardPermission)[keyof typeof BoardPermission]

export const WorkspacePermission = {
  ViewWorkspace: 'view_workspace',
  EditWorkspace: 'edit_workspace',
  DeleteWorkspace: 'delete_workspace',
  ManageMembers: 'manage_members'
} as const

export type WorkspacePermission = (typeof WorkspacePermission)[keyof typeof WorkspacePermission]
```

### Regex Patterns

✅ **DO**: Define reusable regex patterns

```typescript
// constants/regex.ts
export const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
```

## Touch Points / Key Files

- **HTTP Status**: `src/constants/http-status.ts` - HTTP status codes (default export)
- **Messages**: `src/constants/messages.ts` - User-facing messages organized by feature
- **Enums**: `src/constants/enums.ts` - BoardVisibility, BoardRole, UserVerifyStatus, TokenType, etc.
- **Permissions**: `src/constants/permissions.ts` - Permission constants for RBAC
- **Error Codes**: `src/constants/error-codes.ts` - Error codes for client handling
- **Regex**: `src/constants/regex.ts` - Validation regex patterns
- **Domains**: `src/constants/domains.ts` - Domain URLs and external service URLs

## JIT Index Hints

```bash
# Find a constant definition
rg -n "export const.*=" src/constants

# Find enum definitions
rg -n "export enum" src/constants

# Find message usage
rg -n "BOARDS_MESSAGES\.|AUTH_MESSAGES\." src

# Find HTTP status usage
rg -n "HTTP_STATUS\." src

# Find permission usage
rg -n "BoardPermission\.|WorkspacePermission\." src

# Find error code usage
rg -n "error_code:" src
```

## Common Gotchas

- **Const assertions** - Use `as const` for enum-like objects
- **Default vs Named exports** - `HTTP_STATUS` uses default export, messages use named exports
- **Message organization** - Group messages by feature domain
- **Single source of truth** - Don't duplicate constants, import from here
- **Error codes** - Use for client-side error handling logic

## Pre-PR Checks

```bash
# Type check constants
npm run build

# Verify constants are used (not hardcoded values)
rg -n "HTTP_STATUS\.|BOARDS_MESSAGES\." src

# Find hardcoded status codes (should use HTTP_STATUS instead)
rg -n "status: [0-9]{3}" src
```
