import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { CreateWorkspaceReqBody, WorkspaceParams } from '~/models/requests/Workspace.requests'
import workspacesService from '~/services/workspaces.services'

export const createWorkspaceController = async (
  req: Request<ParamsDictionary, any, CreateWorkspaceReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await workspacesService.createWorkspace(user_id, req.body)
  return res.json({ message: WORKSPACES_MESSAGES.CREATE_WORKSPACE_SUCCESS, result })
}

export const getWorkspaceController = async (req: Request<WorkspaceParams>, res: Response) => {
  const result = { ...req.workspace }
  return res.json({ message: WORKSPACES_MESSAGES.GET_WORKSPACE_SUCCESS, result })
}
