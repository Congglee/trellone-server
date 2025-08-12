import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
import { BoardInvitation, WorkspaceInvitation } from '~/models/Extensions'
import { Pagination } from '~/models/requests/Common.requests'
import {
  InvitationParams,
  CreateNewBoardInvitationReqBody,
  CreateNewWorkspaceInvitationReqBody,
  UpdateBoardInvitationReqBody,
  VerifyInvitationReqBody,
  UpdateWorkspaceInvitationReqBody
} from '~/models/requests/Invitation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import Workspace from '~/models/schemas/Workspace.schema'
import invitationsService from '~/services/invitations.services'

export const createNewWorkspaceInvitationController = async (
  req: Request<ParamsDictionary, any, CreateNewWorkspaceInvitationReqBody>,
  res: Response
) => {
  const invitee = req.invitee as User
  const workspace = req.workspace as Workspace

  // The user making this request is the inviter - the person who sends the invitation
  const { user_id: inviter_id } = req.decoded_authorization as TokenPayload

  const result = await invitationsService.createNewWorkspaceInvitation(req.body, inviter_id, invitee, workspace)

  return res.json({ message: INVITATIONS_MESSAGES.CREATE_NEW_WORKSPACE_INVITATION_SUCCESS, result })
}

export const createNewBoardInvitationController = async (
  req: Request<ParamsDictionary, any, CreateNewBoardInvitationReqBody>,
  res: Response
) => {
  const invitee = req.invitee as User
  const board = req.board as Board

  // The user making this request is the inviter - the person who sends the invitation
  const { user_id: inviter_id } = req.decoded_authorization as TokenPayload

  const result = await invitationsService.createNewBoardInvitation(req.body, inviter_id, invitee, board)

  return res.json({ message: INVITATIONS_MESSAGES.CREATE_NEW_BOARD_INVITATION_SUCCESS, result })
}

export const getInvitationsController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await invitationsService.getInvitations({ user_id, limit, page })

  return res.json({
    message: INVITATIONS_MESSAGES.GET_INVITATIONS_SUCCESS,
    result: {
      invitations: result.invitations,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const verifyInvitationController = async (
  req: Request<ParamsDictionary, any, VerifyInvitationReqBody>,
  res: Response
) => {
  return res.json({ message: INVITATIONS_MESSAGES.VERIFY_INVITATION_SUCCESS })
}

export const updateWorkspaceInvitationController = async (
  req: Request<InvitationParams, any, UpdateWorkspaceInvitationReqBody>,
  res: Response
) => {
  const { invitation_id } = req.params
  const invitation = req.invitation as Invitation

  const invitee_id = invitation.invitee_id.toString()

  const body = { ...(invitation.workspace_invitation as WorkspaceInvitation), status: req.body.status }

  const result = await invitationsService.updateWorkspaceInvitation(invitation_id, invitee_id, body)

  return res.json({
    message: INVITATIONS_MESSAGES.UPDATE_WORKSPACE_INVITATION_SUCCESS,
    result
  })
}

export const updateBoardInvitationController = async (
  req: Request<InvitationParams, any, UpdateBoardInvitationReqBody>,
  res: Response
) => {
  const { invitation_id } = req.params
  const invitation = req.invitation as Invitation

  const invitee_id = invitation.invitee_id.toString()

  const body = { ...(invitation.board_invitation as BoardInvitation), status: req.body.status }

  const result = await invitationsService.updateBoardInvitation(invitation_id, invitee_id, body)

  return res.json({
    message: INVITATIONS_MESSAGES.UPDATE_BOARD_INVITATION_SUCCESS,
    result
  })
}
