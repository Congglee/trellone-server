import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
import { Pagination } from '~/models/requests/Common.requests'
import { CreateNewBoardInvitationReqBody } from '~/models/requests/Invitation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import invitationsService from '~/services/invitations.services'

export const createNewBoardInvitationController = async (
  req: Request<ParamsDictionary, any, CreateNewBoardInvitationReqBody>,
  res: Response
) => {
  // The user making this request is the Inviter - the person who sends the invitation
  const { user_id: inviter_id } = req.decoded_authorization as TokenPayload
  const result = await invitationsService.createNewBoardInvitation(req.body, inviter_id)

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
