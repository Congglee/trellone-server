# Sockets - Agent Guide

## Package Identity

Socket.IO event handlers for real-time features in Trellone. Handles board updates, card changes, workspace events, and invitation notifications.

## Setup & Run

Socket handlers are registered in the Socket.IO server setup. No separate build step needed.

```typescript
import { handleBoardEvents } from '~/sockets/boards.sockets'
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
```

✅ **DO**: Use Socket.IO types

```typescript
import { Server, Socket } from 'socket.io'

export const updateBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {
    socket.broadcast.to(`board-${board._id}`).emit('SERVER_BOARD_UPDATED', board)
  })
}
```

### Authentication

✅ **DO**: Authentication handled in middleware (`src/utils/socket.ts`)

```typescript
// Authentication is handled in io.use() middleware
// Socket verifies JWT token from cookie or auth header
// Token payload stored in socket.data.decoded_authorization
io.use(async (socket, next) => {
  const access_token = getTokenFromCookieOrAuth(socket)
  const decoded = await verifyAccessToken(access_token)
  socket.data.decoded_authorization = decoded
  next()
})
```

✅ **DO**: Access user ID from socket data

```typescript
const { user_id } = socket.data.decoded_authorization as TokenPayload
users[user_id] = { socket_id: socket.id }
```

### Room Management

✅ **DO**: Use consistent room naming convention

```typescript
// Board rooms: board-${boardId}
socket.on('CLIENT_JOIN_BOARD', (boardId) => {
  socket.join(`board-${boardId}`)
})

// Workspace rooms: workspace-${workspaceId}
socket.on('CLIENT_JOIN_WORKSPACE', (workspaceId) => {
  socket.join(`workspace-${workspaceId}`)
})

// Global index room for boards list page
socket.on('CLIENT_JOIN_WORKSPACES_INDEX', () => {
  socket.join('workspaces-index')
})
```

✅ **DO**: Broadcast events to specific rooms

```typescript
// Broadcast to board room (excluding sender)
socket.broadcast.to(`board-${boardId}`).emit('SERVER_BOARD_UPDATED', board)

// Broadcast to workspace room
socket.broadcast.to(`workspace-${workspaceId}`).emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)

// Broadcast to global index room
io.to('workspaces-index').emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)
```

✅ **DO**: Target specific user by socket_id for notifications

```typescript
// For user-specific notifications (e.g., invitations)
const targetUser = users[invitation.invitee_id]
if (targetUser?.socket_id) {
  io.to(targetUser.socket_id).emit('SERVER_USER_INVITED_TO_BOARD', invitation)
}
```

### Event Naming Convention

✅ **DO**: Use CLIENT*/SERVER* prefix convention

```typescript
// Client events (emitted by client)
socket.on('CLIENT_JOIN_BOARD', (boardId) => {})
socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {})
socket.on('CLIENT_USER_INVITED_TO_BOARD', (invitation) => {})

// Server events (emitted by server)
socket.emit('SERVER_BOARD_UPDATED', board)
socket.emit('SERVER_CARD_UPDATED', card)
socket.emit('SERVER_USER_INVITED_TO_BOARD', invitation)
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

### Error Handling

✅ **DO**: Handle socket errors

```typescript
socket.on('error', (error) => {
  console.error('Socket error:', error)
  socket.emit('error', { message: 'An error occurred' })
})
```

## Touch Points / Key Files

- **Socket Initialization**: `src/utils/socket.ts` - Socket.IO server setup with authentication middleware
- **Boards Sockets**: `src/sockets/boards.sockets.ts` - Board room management and updates
- **Cards Sockets**: `src/sockets/cards.sockets.ts` - Card update events
- **Workspaces Sockets**: `src/sockets/workspaces.sockets.ts` - Workspace room management and updates
- **Invitations Sockets**: `src/sockets/invitations.sockets.ts` - Invitation notifications

### Socket Initialization Flow

1. **Server Setup** (`src/utils/socket.ts`):

   - Creates Socket.IO server with CORS configuration
   - Configures ping/pong intervals for connection stability
   - Sets up authentication middleware (`io.use()`)
   - Registers all socket event handlers on connection

2. **Authentication Middleware**:

   - Checks for access token in cookie (preferred) or auth header
   - Verifies JWT token using `verifyAccessToken()`
   - Stores decoded token in `socket.data.decoded_authorization`
   - Tracks connected users in `users` map: `{ user_id: { socket_id } }`

3. **Event Handler Registration**:
   - All handlers registered in `io.on('connection')` callback
   - Handlers organized by domain (boards, workspaces, invitations, cards)
   - User tracking map passed to handlers that need it

### Socket Event Handlers

**Board Events** (`boards.sockets.ts`):

- `CLIENT_JOIN_BOARD` - Join board room
- `CLIENT_LEAVE_BOARD` - Leave board room
- `CLIENT_USER_UPDATED_BOARD` - Broadcast board update to room
- `CLIENT_USER_ACCEPTED_BOARD_INVITATION` - Notify board members of new member
- `CLIENT_USER_DELETED_BOARD` - Notify board members of deletion

**Workspace Events** (`workspaces.sockets.ts`):

- `CLIENT_JOIN_WORKSPACE` - Join workspace room
- `CLIENT_LEAVE_WORKSPACE` - Leave workspace room
- `CLIENT_JOIN_WORKSPACES_INDEX` - Join global index room
- `CLIENT_LEAVE_WORKSPACES_INDEX` - Leave global index room
- `CLIENT_USER_UPDATED_WORKSPACE` - Broadcast workspace update
- `CLIENT_USER_CREATED_WORKSPACE_BOARD` - Notify workspace members of new board

**Card Events** (`cards.sockets.ts`):

- `CLIENT_USER_UPDATED_CARD` - Broadcast card update to board room

**Invitation Events** (`invitations.sockets.ts`):

- `CLIENT_USER_INVITED_TO_BOARD` - Send invitation notification to specific user
- `CLIENT_USER_INVITED_TO_WORKSPACE` - Send invitation notification to specific user

## JIT Index Hints

```bash
# Find socket event handlers
rg -n "socket\.on\(|socket\.broadcast" src/sockets

# Find CLIENT_ event handlers
rg -n "CLIENT_" src/sockets

# Find SERVER_ event emissions
rg -n "SERVER_" src/sockets

# Find room management
rg -n "socket\.join|socket\.leave" src/sockets

# Find socket initialization
rg -n "initSocket|io\.use|io\.on\('connection'" src/utils/socket.ts

# Find user tracking
rg -n "users\[.*socket_id" src/utils/socket.ts
```

## Common Gotchas

- **Authentication** - Handled in middleware, not in individual handlers
- **Room naming** - Use `board-${boardId}` and `workspace-${workspaceId}` format (not `board:${boardId}`)
- **Event prefixes** - Always use `CLIENT_` prefix for client events, `SERVER_` for server events
- **Broadcasting** - Use `socket.broadcast.to(room)` to exclude sender, `io.to(room)` to include all
- **User tracking** - Users map tracks `{ user_id: { socket_id } }` for targeted notifications
- **Error handling** - Socket errors handled in `socket.on('error')` in initialization
- **Type safety** - Use Socket.IO types (`Server`, `Socket`) for better type safety
- **Disconnection cleanup** - Remove user from tracking map in `socket.on('disconnect')`

## Pre-PR Checks

```bash
# Type check sockets
npm run build

# Verify socket authentication
rg -n "verifyToken|handshake\.auth" src/sockets
```
