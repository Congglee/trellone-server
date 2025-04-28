import { Socket } from 'socket.io'

export const updateBoardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_BOARD', (board) => {
    // Broadcast the board update to all connected clients except the sender
    // This ensures all members in the board will receive the updated board data
    socket.broadcast.to(`board-${board._id}`).emit('SERVER_BOARD_UPDATED', board)
  })

  // Handle joining a board room when a user opens a board
  socket.on('CLIENT_JOIN_BOARD', (boardId) => {
    socket.join(`board-${boardId}`)
  })

  // Handle leaving a board room when a user leaves a board
  socket.on('CLIENT_LEAVE_BOARD', (boardId) => {
    socket.leave(`board-${boardId}`)
  })
}
