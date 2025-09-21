import { Socket } from 'socket.io'

export const manageBoardSocketEvents = (socket: Socket) => {
  // Handle joining a board room when a user opens a board
  socket.on('CLIENT_JOIN_BOARD', (boardId) => {
    socket.join(`board-${boardId}`)
  })

  // Handle leaving a board room when a user closes a board
  socket.on('CLIENT_LEAVE_BOARD', (boardId) => {
    socket.leave(`board-${boardId}`)
  })
}

export const updateBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {
    // Broadcast the board update to all connected clients except the sender
    // This ensures all members in the board will receive the updated board data
    socket.broadcast.to(`board-${board._id}`).emit('SERVER_BOARD_UPDATED', board)
  })
}

export const acceptBoardInvitationSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_ACCEPTED_BOARD_INVITATION', ({ boardId, invitee }) => {
    // Broadcast to all users in the board room that a new member has joined
    // This allows real-time updates when someone accepts an invitation
    socket.broadcast.to(`board-${boardId}`).emit('SERVER_USER_ACCEPTED_BOARD_INVITATION', invitee)
  })
}

export const deleteBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_DELETED_BOARD', (boardId) => {
    socket.broadcast.to(`board-${boardId}`).emit('SERVER_USER_DELETED_BOARD', boardId)
  })
}
