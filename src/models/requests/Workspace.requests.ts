import { ParamsDictionary } from 'express-serve-static-core'
import { WorkspaceGuestAction, WorkspaceMemberAction, WorkspaceRole, WorkspaceType } from '~/constants/enums'

export interface CreateWorkspaceReqBody {
  title: string
  description?: string
}

export interface WorkspaceParams extends ParamsDictionary {
  workspace_id: string
}

export interface UpdateWorkspaceReqBody extends CreateWorkspaceReqBody {
  type?: WorkspaceType
  logo?: string
  member?: {
    action: WorkspaceMemberAction
    user_id: string
    role?: WorkspaceRole
    board_id?: string
  }
  guest?: {
    action: WorkspaceGuestAction
    user_id: string
    board_id?: string
  }
}
