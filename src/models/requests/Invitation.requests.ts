import { ParamsDictionary } from 'express-serve-static-core'
import { BoardInvitationStatus } from '~/constants/enums'
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

export interface BoardInvitationParams extends ParamsDictionary {
  invitation_id: string
}

export interface UpdateBoardInvitationReqBody {
  status: BoardInvitationStatus
  board_id: string
}
