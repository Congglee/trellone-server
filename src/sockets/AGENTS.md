# Sockets - Agent Guide

## Package Identity

Socket.IO event handlers for real-time features in Trellone. Handles board updates, card changes, workspace events, and invitation notifications.

## Setup & Run

Socket handlers are registered in `src/utils/socket.ts`. No separate build step needed.

```typescript
import { manageBoardSocketEvents, updateBoardSocket } from '~/sockets/boards.sockets'
```

## Patterns & Conventions

### File Organization

- **One file per domain**: Each domain has its own socket file (e.g., `boards.sockets.ts`, `cards.sockets.ts`)
- **Naming**: Use kebab-case with `.sockets.ts` suffix
- **Exports**: Named exports for event handler functions

✅ **DO**: Follow `src/sockets/boards.sockets.ts` pattern

- Export event handler functions
- Use Socket.IO types for type safety
- Handle room management and broadcasting

### Socket Handler Structure

✅ **DO**: Export event handler functions

```typescript
// sockets/boards.sockets.ts
import { Socket } from 'socket.io'

export const manageBoardSocketEvents = (socket: Socket) => {
  socket.on('CLIENT_JOIN_BOARD', (boardId) => {
    socket.join(`board-${boardId}`)
  })

  socket.on('CLIENT_LEAVE_BOARD', (boardId) => {
    socket.leave(`board-${boardId}`)
  })
}

export const updateBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {
    socket.broadcast.to(`board-${board._id}`).emit('SERVER_BOARD_UPDATED', board)
  })
}

export const acceptBoardInvitationSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_ACCEPTED_BOARD_INVITATION', ({ boardId, invitee }) => {
    socket.broadcast.to(`board-${boardId}`).emit('SERVER_USER_ACCEPTED_BOARD_INVITATION', invitee)
  })
}

export const deleteBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_DELETED_BOARD', (boardId) => {
    socket.broadcast.to(`board-${boardId}`).emit('SERVER_USER_DELETED_BOARD', boardId)
  })
}
```

✅ **DO**: Use Socket.IO types

```typescript
import { Server, Socket } from 'socket.io'

// For handlers that need io (server instance)
export const manageWorkspaceSocketEvents = (io: Server, socket: Socket) => {
  // ...
}

// For handlers that only need socket
export const updateBoardSocket = (socket: Socket) => {
  // ...
}
```

### Authentication

✅ **DO**: Authentication handled in middleware (`src/utils/socket.ts`)

```typescript
// Authentication is handled in io.use() middleware in utils/socket.ts
// Token verified from cookie (preferred) or auth header
// Token payload stored in socket.data.decoded_authorization

// Access user ID in handlers:
const { user_id } = socket.data.decoded_authorization as TokenPayload
```

### Room Management

✅ **DO**: Use consistent room naming convention

```typescript
// Board rooms: board-${boardId}
socket.on('CLIENT_JOIN_BOARD', (boardId) => {
  socket.join(`board-${boardId}`)
})

socket.on('CLIENT_LEAVE_BOARD', (boardId) => {
  socket.leave(`board-${boardId}`)
})

// Workspace rooms: workspace-${workspaceId}
socket.on('CLIENT_JOIN_WORKSPACE', (workspaceId) => {
  socket.join(`workspace-${workspaceId}`)
})

socket.on('CLIENT_LEAVE_WORKSPACE', (workspaceId) => {
  socket.leave(`workspace-${workspaceId}`)
})

// Global index room for boards list page
socket.on('CLIENT_JOIN_WORKSPACES_INDEX', () => {
  socket.join('workspaces-index')
})

socket.on('CLIENT_LEAVE_WORKSPACES_INDEX', () => {
  socket.leave('workspaces-index')
})
```

✅ **DO**: Broadcast events to specific rooms

```typescript
// Broadcast to board room (excluding sender)
socket.broadcast.to(`board-${boardId}`).emit('SERVER_BOARD_UPDATED', board)

// Broadcast to workspace room (excluding sender)
socket.broadcast.to(`workspace-${workspaceId}`).emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)

// Broadcast to global index room (including all)
io.to('workspaces-index').emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)
```

✅ **DO**: Target specific user by socket_id for notifications

```typescript
// For user-specific notifications (e.g., invitations)
export const inviteUserToBoardSocket = (
  io: Server,
  socket: Socket,
  users: { [key: string]: { socket_id: string } }
) => {
  socket.on('CLIENT_USER_INVITED_TO_BOARD', (invitation) => {
    const targetUser = users[invitation.invitee_id]

    if (targetUser?.socket_id) {
      // User is online - send directly
      io.to(targetUser.socket_id).emit('SERVER_USER_INVITED_TO_BOARD', invitation)
    } else {
      // User is offline - broadcast as fallback
      socket.broadcast.emit('SERVER_USER_INVITED_TO_BOARD', invitation)
    }
  })
}
```

### Event Naming Convention

✅ **DO**: Use CLIENT*/SERVER* prefix convention

```typescript
// Client events (emitted by client, handled by server)
socket.on('CLIENT_JOIN_BOARD', (boardId) => {})
socket.on('CLIENT_LEAVE_BOARD', (boardId) => {})
socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {})
socket.on('CLIENT_USER_INVITED_TO_BOARD', (invitation) => {})
socket.on('CLIENT_USER_ACCEPTED_BOARD_INVITATION', ({ boardId, invitee }) => {})
socket.on('CLIENT_USER_DELETED_BOARD', (boardId) => {})

socket.on('CLIENT_JOIN_WORKSPACE', (workspaceId) => {})
socket.on('CLIENT_LEAVE_WORKSPACE', (workspaceId) => {})
socket.on('CLIENT_JOIN_WORKSPACES_INDEX', () => {})
socket.on('CLIENT_LEAVE_WORKSPACES_INDEX', () => {})
socket.on('CLIENT_USER_UPDATED_WORKSPACE', (workspaceId, boardId?) => {})
socket.on('CLIENT_USER_CREATED_WORKSPACE_BOARD', (workspaceId) => {})
socket.on('CLIENT_USER_INVITED_TO_WORKSPACE', (invitation) => {})

socket.on('CLIENT_USER_UPDATED_CARD', (card) => {})

// Server events (emitted by server, handled by client)
socket.emit('SERVER_BOARD_UPDATED', board)
socket.emit('SERVER_USER_ACCEPTED_BOARD_INVITATION', invitee)
socket.emit('SERVER_USER_DELETED_BOARD', boardId)
socket.emit('SERVER_USER_INVITED_TO_BOARD', invitation)

socket.emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)
socket.emit('SERVER_WORKSPACE_BOARD_CREATED', workspaceId)
socket.emit('SERVER_USER_INVITED_TO_WORKSPACE', invitation)

socket.emit('SERVER_CARD_UPDATED', card)
```

❌ **DON'T**: Use generic event names without prefix

```typescript
// ❌ Bad
socket.on('join-board', () => {})
socket.emit('board-updated', board)

// ✅ Good
socket.on('CLIENT_JOIN_BOARD', () => {})
socket.emit('SERVER_BOARD_UPDATED', board)
```

## Touch Points / Key Files

- **Socket Initialization**: `src/utils/socket.ts` - Socket.IO server setup with auth middleware
- **Boards Sockets**: `src/sockets/boards.sockets.ts` - Board room management and updates
- **Cards Sockets**: `src/sockets/cards.sockets.ts` - Card update events
- **Workspaces Sockets**: `src/sockets/workspaces.sockets.ts` - Workspace room management
- **Invitations Sockets**: `src/sockets/invitations.sockets.ts` - Invitation notifications

### Complete Event Reference

**Board Events** (`boards.sockets.ts`):

| Client Event                            | Server Event                            | Description              |
| --------------------------------------- | --------------------------------------- | ------------------------ |
| `CLIENT_JOIN_BOARD`                     | -                                       | Join board room          |
| `CLIENT_LEAVE_BOARD`                    | -                                       | Leave board room         |
| `CLIENT_USER_UPDATED_BOARD`             | `SERVER_BOARD_UPDATED`                  | Broadcast board update   |
| `CLIENT_USER_ACCEPTED_BOARD_INVITATION` | `SERVER_USER_ACCEPTED_BOARD_INVITATION` | Notify new member joined |
| `CLIENT_USER_DELETED_BOARD`             | `SERVER_USER_DELETED_BOARD`             | Notify board members     |

**Workspace Events** (`workspaces.sockets.ts`):

| Client Event                          | Server Event                     | Description                |
| ------------------------------------- | -------------------------------- | -------------------------- |
| `CLIENT_JOIN_WORKSPACE`               | -                                | Join workspace room        |
| `CLIENT_LEAVE_WORKSPACE`              | -                                | Leave workspace room       |
| `CLIENT_JOIN_WORKSPACES_INDEX`        | -                                | Join global index room     |
| `CLIENT_LEAVE_WORKSPACES_INDEX`       | -                                | Leave global index room    |
| `CLIENT_USER_UPDATED_WORKSPACE`       | `SERVER_WORKSPACE_UPDATED`       | Broadcast workspace update |
| `CLIENT_USER_CREATED_WORKSPACE_BOARD` | `SERVER_WORKSPACE_BOARD_CREATED` | Notify new board created   |

**Card Events** (`cards.sockets.ts`):

| Client Event               | Server Event          | Description           |
| -------------------------- | --------------------- | --------------------- |
| `CLIENT_USER_UPDATED_CARD` | `SERVER_CARD_UPDATED` | Broadcast card update |

**Invitation Events** (`invitations.sockets.ts`):

| Client Event                       | Server Event                       | Description    |
| ---------------------------------- | ---------------------------------- | -------------- |
| `CLIENT_USER_INVITED_TO_BOARD`     | `SERVER_USER_INVITED_TO_BOARD`     | Notify invitee |
| `CLIENT_USER_INVITED_TO_WORKSPACE` | `SERVER_USER_INVITED_TO_WORKSPACE` | Notify invitee |

## JIT Index Hints

```bash
# Find socket event handlers
rg -n "socket\.on\(" src/sockets

# Find CLIENT_ event handlers
rg -n "CLIENT_" src/sockets

# Find SERVER_ event emissions
rg -n "SERVER_" src/sockets

# Find room management
rg -n "socket\.join|socket\.leave" src/sockets

# Find socket initialization
rg -n "initSocket|io\.on\('connection'" src/utils/socket.ts

# Find user tracking
rg -n "users\[" src
```

## Common Gotchas

- **Authentication** - Handled in middleware (`utils/socket.ts`), not in handlers
- **Room naming** - Use `board-${boardId}` and `workspace-${workspaceId}` format (hyphen, not colon)
- **Event prefixes** - Always use `CLIENT_` for client events, `SERVER_` for server events
- **Broadcasting** - Use `socket.broadcast.to(room)` to exclude sender, `io.to(room)` to include all
- **User tracking** - Users map tracks `{ user_id: { socket_id } }` for targeted notifications
- **Type imports** - Import `Server` when using `io`, import `Socket` when using `socket` only
- **Disconnection cleanup** - User removed from tracking map in `socket.on('disconnect')` in utils/socket.ts

## Pre-PR Checks

```bash
# Type check sockets
npm run build

# Verify event naming convention
rg -n "CLIENT_|SERVER_" src/sockets

# Verify room naming convention
rg -n "socket\.join\(|socket\.broadcast\.to\(" src/sockets
```
