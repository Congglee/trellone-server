import { ParamsDictionary } from 'express-serve-static-core'
import { WorkspaceRole, WorkspaceType } from '~/constants/enums'

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
}

export interface EditWorkspaceMemberRoleReqBody {
  role: WorkspaceRole
}

export interface WorkspaceMemberParams extends WorkspaceParams {
  user_id: string
}

export interface WorkspaceGuestParams extends WorkspaceParams {
  user_id: string
}

export interface RemoveWorkspaceMemberFromBoardReqBody {
  board_id: string
}

export interface RemoveGuestFromBoardReqBody {
  board_id: string
}

export interface WorkspaceBoardParams extends WorkspaceParams {
  board_id: string
}
