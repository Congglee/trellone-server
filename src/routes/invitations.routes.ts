import { Router } from 'express'
import {
  createNewBoardInvitationController,
  createNewWorkspaceInvitationController,
  getInvitationsController,
  updateBoardInvitationController,
  updateWorkspaceInvitationController,
  verifyInvitationController
} from '~/controllers/invitations.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import {
  boardInvitationUpdateGuard,
  checkInviteeMembershipValidator,
  createNewBoardInvitationValidator,
  createNewWorkspaceInvitationValidator,
  invitationIdValidator,
  updateBoardInvitationValidator,
  updateWorkspaceInvitationValidator,
  verifyInviteTokenValidator,
  workspaceInvitationUpdateGuard
} from '~/middlewares/invitations.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { UpdateBoardInvitationReqBody, UpdateWorkspaceInvitationReqBody } from '~/models/requests/Invitation.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const invitationsRouter = Router()

invitationsRouter.post(
  '/workspace',
  accessTokenValidator,
  verifiedUserValidator,
  createNewWorkspaceInvitationValidator,
  checkInviteeMembershipValidator,
  wrapRequestHandler(createNewWorkspaceInvitationController)
)

invitationsRouter.post(
  '/board',
  accessTokenValidator,
  verifiedUserValidator,
  createNewBoardInvitationValidator,
  checkInviteeMembershipValidator,
  wrapRequestHandler(createNewBoardInvitationController)
)

invitationsRouter.post(
  '/verify-invitation',
  accessTokenValidator,
  verifiedUserValidator,
  verifyInviteTokenValidator,
  wrapRequestHandler(verifyInvitationController)
)

invitationsRouter.get('/', accessTokenValidator, paginationValidator, wrapRequestHandler(getInvitationsController))

invitationsRouter.put(
  '/workspace/:invitation_id',
  accessTokenValidator,
  invitationIdValidator,
  updateWorkspaceInvitationValidator,
  workspaceInvitationUpdateGuard,
  filterMiddleware<UpdateWorkspaceInvitationReqBody>(['status']),
  wrapRequestHandler(updateWorkspaceInvitationController)
)

invitationsRouter.put(
  '/board/:invitation_id',
  accessTokenValidator,
  invitationIdValidator,
  updateBoardInvitationValidator,
  boardInvitationUpdateGuard,
  filterMiddleware<UpdateBoardInvitationReqBody>(['status']),
  wrapRequestHandler(updateBoardInvitationController)
)

export default invitationsRouter
