import { Router } from 'express'
import {
  createNewBoardInvitationController,
  getInvitationsController,
  updateBoardInvitationController,
  verifyBoardInvitationController
} from '~/controllers/invitations.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import {
  boardInvitationIdValidator,
  checkInviteeMembershipValidator,
  createNewBoardInvitationValidator,
  updateBoardInvitationValidator,
  verifyInviteTokenValidator
} from '~/middlewares/invitations.middlewares'
import { UpdateBoardInvitationReqBody } from '~/models/requests/Invitation.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const invitationsRouter = Router()

invitationsRouter.post(
  '/board',
  accessTokenValidator,
  createNewBoardInvitationValidator,
  checkInviteeMembershipValidator,
  wrapRequestHandler(createNewBoardInvitationController)
)

invitationsRouter.post(
  '/verify-board-invitation',
  accessTokenValidator,
  verifyInviteTokenValidator,
  wrapRequestHandler(verifyBoardInvitationController)
)

invitationsRouter.get('/', accessTokenValidator, paginationValidator, wrapRequestHandler(getInvitationsController))

invitationsRouter.put(
  '/board/:invitation_id',
  accessTokenValidator,
  boardInvitationIdValidator,
  updateBoardInvitationValidator,
  filterMiddleware<UpdateBoardInvitationReqBody>(['status']),
  wrapRequestHandler(updateBoardInvitationController)
)

export default invitationsRouter
