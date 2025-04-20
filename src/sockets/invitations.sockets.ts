import { Socket } from 'socket.io'

export const inviteUserToBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_INVITED_TO_BOARD', (invitation) => {
    // Emit the opposite of an event for every other client (except the user who sent the event), then let CLIENT check the event
    socket.broadcast.emit('SERVER_USER_INVITED_TO_BOARD', invitation)
  })
}
