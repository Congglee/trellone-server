import { Server, Socket } from 'socket.io'

export const manageWorkspaceSocketEvents = (io: Server, socket: Socket) => {
  // Handle joining a workspace room when a user opens a workspace
  socket.on('CLIENT_JOIN_WORKSPACE', (workspaceId) => {
    socket.join(`workspace-${workspaceId}`)
  })

  // Handle leaving a workspace room when a user closes a workspace
  socket.on('CLIENT_LEAVE_WORKSPACE', (workspaceId) => {
    socket.leave(`workspace-${workspaceId}`)
  })

  // Global index room for boards list page watchers
  socket.on('CLIENT_JOIN_WORKSPACES_INDEX', () => {
    socket.join('workspaces-index')
  })

  socket.on('CLIENT_LEAVE_WORKSPACES_INDEX', () => {
    socket.leave('workspaces-index')
  })
}

export const updateWorkspaceSocket = (io: Server, socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_WORKSPACE', (workspaceId: string, boardId?: string) => {
    // Broadcast the workspace update to all connected clients except the sender
    // This ensures all members in the workspace will receive the updated workspace data
    socket.broadcast.to(`workspace-${workspaceId}`).emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)
    // Notify all watchers on the boards list page
    io.to('workspaces-index').emit('SERVER_WORKSPACE_UPDATED', workspaceId, boardId)
  })
}

export const createWorkspaceBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_CREATED_WORKSPACE_BOARD', (workspaceId) => {
    socket.broadcast.to(`workspace-${workspaceId}`).emit('SERVER_WORKSPACE_BOARD_CREATED', workspaceId)
  })
}
