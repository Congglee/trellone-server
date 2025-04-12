import { TokenPayload } from '~/models/requests/User.requests'

export interface CreateNewBoardInvitationReqBody {
  invitee_email: string
  board_id: string
}

export interface InviteTokenPayload extends TokenPayload {
  inviter_id: string
  invitation_id: string
}

export interface VerifyBoardInvitationReqBody {
  invite_token: string
}
