import { Socket } from 'socket.io'

export const updateCardSocket = (socket: Socket) => {
  socket.on('CLIENT_USER_UPDATED_CARD', (card) => {
    // Broadcast the card update to all clients in the board room except the sender
    socket.broadcast.to(`board-${card.board_id}`).emit('SERVER_CARD_UPDATED', card)
  })
}
