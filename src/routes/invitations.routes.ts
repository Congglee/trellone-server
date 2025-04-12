import { Router } from 'express'
import {
  createNewBoardInvitationController,
  getInvitationsController,
  verifyBoardInvitationController
} from '~/controllers/invitations.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { paginationValidator } from '~/middlewares/common.middlewares'
import { createNewBoardInvitationValidator, verifyInviteTokenValidator } from '~/middlewares/invitations.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const invitationsRouter = Router()

invitationsRouter.post(
  '/board',
  accessTokenValidator,
  createNewBoardInvitationValidator,
  wrapRequestHandler(createNewBoardInvitationController)
)

invitationsRouter.post(
  '/verify-board-invitation',
  verifyInviteTokenValidator,
  wrapRequestHandler(verifyBoardInvitationController)
)

invitationsRouter.get('/', accessTokenValidator, paginationValidator, wrapRequestHandler(getInvitationsController))

export default invitationsRouter
