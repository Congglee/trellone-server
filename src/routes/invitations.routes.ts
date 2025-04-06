import { Router } from 'express'
import { createNewBoardInvitationController } from '~/controllers/invitations.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { createNewBoardInvitationValidator } from '~/middlewares/invitations.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const invitationsRouter = Router()

invitationsRouter.post(
  '/board',
  accessTokenValidator,
  createNewBoardInvitationValidator,
  wrapRequestHandler(createNewBoardInvitationController)
)

export default invitationsRouter
