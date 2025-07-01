import { Server as ServerHttp } from 'http'
import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'
import logger from '~/config/logger'
import { TokenPayload } from '~/models/requests/User.requests'
import { inviteUserToBoardSocket } from '~/sockets/invitations.sockets'
import { manageBoardSocketEvents, updateBoardSocket, acceptBoardInvitationSocket } from '~/sockets/boards.sockets'
import { updateCardSocket } from '~/sockets/cards.sockets'
import { verifyAccessToken } from '~/utils/jwt'

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, { cors: corsOptions })

  const users: { [key: string]: { socket_id: string } } = {}

  io.use(async (socket, next) => {
    const cookieHeader = socket.handshake.headers.cookie

    if (!cookieHeader) {
      return next(new Error('No cookies found'))
    }

    const cookies: { [key: string]: string } = {}

    cookieHeader.split(';').forEach((cookie) => {
      const parts = cookie.split('=')

      if (parts.length === 2) {
        const key = parts[0].trim()
        const value = parts[1].trim()
        cookies[key] = value
      }
    })

    const access_token = cookies['access_token']

    try {
      const decoded_authorization = await verifyAccessToken(access_token)

      socket.handshake.auth.decoded_authorization = decoded_authorization
      socket.handshake.auth.access_token = access_token

      next()
    } catch (error) {
      next({ message: 'Unauthorized', name: 'UnauthorizedError', data: error })
    }
  })

  io.on('connection', (socket) => {
    logger.info(`User ${socket.id} connected`)

    const { user_id } = socket.handshake.auth.decoded_authorization as TokenPayload
    users[user_id] = { socket_id: socket.id }

    socket.use(async (packet, next) => {
      const { access_token } = socket.handshake.auth
      try {
        await verifyAccessToken(access_token)
        next()
      } catch (error) {
        next(new Error('Unauthorized'))
      }
    })

    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    // Call the socket event handlers here depending on the features
    inviteUserToBoardSocket(socket)
    manageBoardSocketEvents(socket)
    updateBoardSocket(socket)
    acceptBoardInvitationSocket(socket)
    updateCardSocket(socket)

    socket.on('disconnect', () => {
      delete users[user_id]
      console.log(`User ${socket.id} disconnected`)
    })
  })
}

export default initSocket
