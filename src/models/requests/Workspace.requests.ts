import { ParamsDictionary } from 'express-serve-static-core'
import { WorkspaceType } from '~/constants/enums'
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
