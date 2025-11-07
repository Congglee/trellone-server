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
- Handle authentication and authorization

### Socket Handler Structure

✅ **DO**: Export event handler functions
```typescript
// sockets/boards.sockets.ts
import { Server, Socket } from 'socket.io'

export const handleBoardEvents = (io: Server, socket: Socket) => {
  socket.on('join-board', async (boardId: string) => {
    // Handle join board event
  })
  
  socket.on('leave-board', async (boardId: string) => {
    // Handle leave board event
  })
}
```

✅ **DO**: Use Socket.IO types
```typescript
import { Server, Socket } from 'socket.io'

export const handleBoardEvents = (io: Server, socket: Socket) => {
  // implementation
}
```

### Authentication

✅ **DO**: Verify socket authentication
```typescript
import { verifyToken } from '~/utils/jwt'
import { envConfig } from '~/config/environment'

const token = socket.handshake.auth.token
const decoded = verifyToken(token, envConfig.JWT_SECRET)
socket.data.user_id = decoded.user_id
```

### Room Management

✅ **DO**: Use rooms for board/workspace isolation
```typescript
socket.on('join-board', async (boardId: string) => {
  socket.join(`board:${boardId}`)
})

socket.on('leave-board', async (boardId: string) => {
  socket.leave(`board:${boardId}`)
})
```

✅ **DO**: Emit events to specific rooms
```typescript
io.to(`board:${boardId}`).emit('board-updated', boardData)
```

### Event Naming

✅ **DO**: Use descriptive event names
```typescript
socket.on('card-moved', handleCardMoved)
socket.on('card-updated', handleCardUpdated)
socket.on('member-added', handleMemberAdded)
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

- **Boards Sockets**: `src/sockets/boards.sockets.ts` - Board-related events
- **Cards Sockets**: `src/sockets/cards.sockets.ts` - Card update events
- **Workspaces Sockets**: `src/sockets/workspaces.sockets.ts` - Workspace events
- **Invitations Sockets**: `src/sockets/invitations.sockets.ts` - Invitation notifications
- **Socket Utils**: `src/utils/socket.ts` - Socket helper functions

## JIT Index Hints

```bash
# Find socket event handlers
rg -n "socket\.on\(|io\.to\(" src/sockets

# Find socket registration
rg -n "handle.*Events|handle.*Sockets" src

# Find room management
rg -n "socket\.join|socket\.leave" src/sockets
```

## Common Gotchas

- **Authentication required** - Always verify socket authentication
- **Room isolation** - Use rooms to isolate events by board/workspace
- **Error handling** - Handle socket errors gracefully
- **Event naming** - Use consistent, descriptive event names
- **Type safety** - Use Socket.IO types for better type safety

## Pre-PR Checks

```bash
# Type check sockets
npm run build

# Verify socket authentication
rg -n "verifyToken|handshake\.auth" src/sockets
```

