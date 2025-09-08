import { Server, Socket } from 'socket.io'

// users map is { user_id: { socket_id } }
export const inviteUserToBoardSocket = (
  io: Server,
  socket: Socket,
  users: { [key: string]: { socket_id: string } }
) => {
  socket.on('CLIENT_USER_INVITED_TO_BOARD', (invitation) => {
    // If invitee is online, notify specifically; otherwise broadcast as fallback
    const targetUser = users[invitation.invitee_id]

    if (targetUser?.socket_id) {
      io.to(targetUser.socket_id).emit('SERVER_USER_INVITED_TO_BOARD', invitation)
    } else {
      socket.broadcast.emit('SERVER_USER_INVITED_TO_BOARD', invitation)
    }
  })
}

export const inviteUserToWorkspaceSocket = (
  io: Server,
  socket: Socket,
  users: { [key: string]: { socket_id: string } }
) => {
  socket.on('CLIENT_USER_INVITED_TO_WORKSPACE', (invitation) => {
    const targetUser = users[invitation.invitee_id]

    if (targetUser?.socket_id) {
      io.to(targetUser.socket_id).emit('SERVER_USER_INVITED_TO_WORKSPACE', invitation)
    } else {
      socket.broadcast.emit('SERVER_USER_INVITED_TO_WORKSPACE', invitation)
    }
  })
}
