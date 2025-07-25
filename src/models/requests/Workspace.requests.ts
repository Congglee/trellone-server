import { ParamsDictionary } from 'express-serve-static-core'
export interface CreateWorkspaceReqBody {
  title: string
  description?: string
}

export interface WorkspaceParams extends ParamsDictionary {
  workspace_id: string
}
