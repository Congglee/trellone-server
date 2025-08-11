import { ParamsDictionary } from 'express-serve-static-core'
import { BoardInvitationStatus, BoardRole, WorkspaceInvitationStatus, WorkspaceRole } from '~/constants/enums'
import { TokenPayload } from '~/models/requests/User.requests'

export interface CreateNewWorkspaceInvitationReqBody {
  invitee_email: string
  workspace_id: string
  role: WorkspaceRole
}

export interface CreateNewBoardInvitationReqBody {
  invitee_email: string
  board_id: string
  workspace_id: string
  role: BoardRole
}

export interface InviteTokenPayload extends TokenPayload {
  inviter_id: string
  invitation_id: string
}

export interface VerifyInvitationReqBody {
  invite_token: string
}

export interface InvitationParams extends ParamsDictionary {
  invitation_id: string
}

export interface UpdateWorkspaceInvitationReqBody {
  status: WorkspaceInvitationStatus
  workspace_id: string
}

export interface UpdateBoardInvitationReqBody {
  status: BoardInvitationStatus
  board_id: string
}
