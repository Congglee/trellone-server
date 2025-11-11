# Constants - Agent Guide

## Package Identity

Application constants for Trellone API. HTTP status codes, messages, enums, permissions, regex patterns, and domain URLs.

## Setup & Run

Constants are imported directly. No separate build step needed.

```typescript
import { HTTP_STATUS } from '~/constants/httpStatus'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { BoardRole } from '~/constants/enums'
```

## Patterns & Conventions

### File Organization

- **HTTP Status**: `src/constants/httpStatus.ts` - HTTP status code constants
- **Messages**: `src/constants/messages.ts` - User-facing messages
- **Enums**: `src/constants/enums.ts` - Application enumerations
- **Permissions**: `src/constants/permissions.ts` - Permission constants
- **Regex**: `src/constants/regex.ts` - Regular expression patterns
- **Domains**: `src/constants/domains.ts` - Domain URLs and constants

✅ **DO**: Follow `src/constants/httpStatus.ts` pattern
- Use const objects for enums
- Export types extracted from constants
- Use descriptive constant names

### Constant Definition

✅ **DO**: Use const objects for enums
```typescript
// constants/enums.ts
export const BoardRole = {
  Admin: 'admin',
  Member: 'member',
  Viewer: 'viewer'
} as const
```

✅ **DO**: Export type from constants
```typescript
export type BoardRoleValue = (typeof BoardRole)[keyof typeof BoardRole]
```

### HTTP Status Codes

✅ **DO**: Use HTTP_STATUS constants
```typescript
// constants/httpStatus.ts
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const
```

### Messages

✅ **DO**: Organize messages by feature
```typescript
// constants/messages.ts
export const BOARDS_MESSAGES = {
  CREATE_BOARD_SUCCESS: 'Board created successfully',
  UPDATE_BOARD_SUCCESS: 'Board updated successfully',
  DELETE_BOARD_SUCCESS: 'Board deleted successfully',
  BOARD_NOT_FOUND: 'Board not found'
} as const
```

### Enums

✅ **DO**: Use const objects for enums
```typescript
// constants/enums.ts
export const BoardVisibility = {
  Public: 'Public',
  Private: 'Private'
} as const

export const BoardRole = {
  Admin: 'admin',
  Member: 'member',
  Viewer: 'viewer'
} as const
```

### Permissions

✅ **DO**: Define permission constants
```typescript
// constants/permissions.ts
export const BoardPermission = {
  VIEW_BOARD: 'view_board',
  EDIT_BOARD: 'edit_board',
  DELETE_BOARD: 'delete_board',
  MANAGE_MEMBERS: 'manage_members'
} as const
```

### Regex Patterns

✅ **DO**: Define reusable regex patterns
```typescript
// constants/regex.ts
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/
```

## Touch Points / Key Files

- **HTTP Status**: `src/constants/httpStatus.ts` - HTTP status code constants
- **Messages**: `src/constants/messages.ts` - User-facing messages organized by feature
- **Enums**: `src/constants/enums.ts` - BoardVisibility, BoardRole, UserType, etc.
- **Permissions**: `src/constants/permissions.ts` - Permission constants for RBAC
- **Regex**: `src/constants/regex.ts` - Validation regex patterns
- **Domains**: `src/constants/domains.ts` - Domain URLs and external service URLs

## JIT Index Hints

```bash
# Find a constant definition
rg -n "export const.*=" src/constants

# Find enum usage
rg -n "BoardRole\.|BoardVisibility\." src

# Find message usage
rg -n "BOARDS_MESSAGES\.|AUTH_MESSAGES\." src

# Find HTTP status usage
rg -n "HTTP_STATUS\." src
```

## Common Gotchas

- **Const assertions** - Use `as const` for enum-like objects
- **Type extraction** - Export types using `typeof` and `keyof`
- **Message organization** - Group messages by feature domain
- **Single source of truth** - Don't duplicate constants, import from here
- **Enum values** - Use string literals, not numbers

## Pre-PR Checks

```bash
# Type check constants
npm run build

# Verify constants are used (not hardcoded values)
rg -n "HTTP_STATUS\.|BOARDS_MESSAGES\." src
```

