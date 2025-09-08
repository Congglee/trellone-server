import { Server as ServerHttp } from 'http'
import { Server } from 'socket.io'
import { corsOptions } from '~/config/cors'
import logger from '~/config/logger'
import { TokenPayload } from '~/models/requests/User.requests'
import { inviteUserToBoardSocket, inviteUserToWorkspaceSocket } from '~/sockets/invitations.sockets'
import { manageBoardSocketEvents, updateBoardSocket, acceptBoardInvitationSocket } from '~/sockets/boards.sockets'
import { updateCardSocket } from '~/sockets/cards.sockets'
import { verifyAccessToken } from '~/utils/jwt'
import {
  manageWorkspaceSocketEvents,
  updateWorkspaceSocket,
  createWorkspaceBoardSocket
} from '~/sockets/workspaces.sockets'

const initSocket = (httpServer: ServerHttp) => {
  const io = new Server(httpServer, {
    cors: corsOptions,
    // Tolerate background tabs and flaky networks better
    pingInterval: 20000,
    pingTimeout: 25000
    // If your infra fully supports WebSocket, consider enabling websocket-only transport:
    // transports: ['websocket']
  })

  const users: { [key: string]: { socket_id: string } } = {}

  io.use(async (socket, next) => {
    // Prefer cookie (HTTP-only refresh flow keeps it freshest), fall back to auth token
    const cookieHeader = socket.handshake.headers.cookie

    let access_token: string | undefined

    if (cookieHeader) {
      const cookies: { [key: string]: string } = {}

      cookieHeader.split(';').forEach((cookie) => {
        const parts = cookie.split('=')
        if (parts.length === 2) {
          const key = parts[0].trim()
          const value = parts[1].trim()
          cookies[key] = value
        }
      })

      access_token = cookies['access_token']
    }

    if (!access_token) {
      const authHeader = (socket.handshake.auth?.Authorization || socket.handshake.auth?.authorization || '') as string
      const bearerPrefix = 'Bearer '

      if (authHeader && authHeader.startsWith(bearerPrefix)) {
        access_token = authHeader.slice(bearerPrefix.length)
      }
    }

    if (!access_token) {
      return next(new Error('Unauthorized'))
    }

    try {
      const decoded_authorization = await verifyAccessToken(access_token)
      // Store on socket.data for downstream handlers
      socket.data.decoded_authorization = decoded_authorization
      socket.data.access_token = access_token
      return next()
    } catch (error) {
      return next({ message: 'Unauthorized', name: 'UnauthorizedError', data: error })
    }
  })

  io.on('connection', (socket) => {
    logger.info(`User ${socket.id} connected`)

    const { user_id } = socket.data.decoded_authorization as TokenPayload
    users[user_id] = { socket_id: socket.id }

    // Avoid re-validating token on every packet to prevent "stale token" disconnects after HTTP refresh
    // If you need strict per-event auth later, pass short-lived user identity via socket.data and re-check permissions per-event
    socket.on('error', (error) => {
      if (error.message === 'Unauthorized') {
        socket.disconnect()
      }
    })

    // Call the socket event handlers here depending on the features
    inviteUserToWorkspaceSocket(io, socket, users)
    inviteUserToBoardSocket(io, socket, users)
    manageWorkspaceSocketEvents(socket)
    manageBoardSocketEvents(socket)
    updateWorkspaceSocket(socket)
    createWorkspaceBoardSocket(socket)
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
