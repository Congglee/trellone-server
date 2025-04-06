import { Request, Response } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
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
