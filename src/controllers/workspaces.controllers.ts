import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { CreateWorkspaceReqBody, UpdateWorkspaceReqBody, WorkspaceParams } from '~/models/requests/Workspace.requests'
import workspacesService from '~/services/workspaces.services'
import { Pagination } from '~/models/requests/Common.requests'

export const createWorkspaceController = async (
  req: Request<ParamsDictionary, any, CreateWorkspaceReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await workspacesService.createWorkspace(user_id, req.body)
  return res.json({ message: WORKSPACES_MESSAGES.CREATE_WORKSPACE_SUCCESS, result })
}

export const getWorkspacesController = async (req: Request<ParamsDictionary, any, any, Pagination>, res: Response) => {
  const user_id = req.decoded_authorization?.user_id as string
  const limit = Number(req.query.limit)
  const page = Number(req.query.page)

  const result = await workspacesService.getWorkspaces({ user_id, limit, page })

  return res.json({
    message: WORKSPACES_MESSAGES.GET_WORKSPACES_SUCCESS,
    result: {
      workspaces: result.workspaces,
      limit,
      page,
      total_page: Math.ceil(result.total / limit)
    }
  })
}

export const getWorkspaceController = async (req: Request<WorkspaceParams>, res: Response) => {
  const result = { ...req.workspace }
  return res.json({ message: WORKSPACES_MESSAGES.GET_WORKSPACE_SUCCESS, result })
}

export const updateWorkspaceController = async (
  req: Request<WorkspaceParams, any, UpdateWorkspaceReqBody>,
  res: Response
) => {
  const { workspace_id } = req.params
  const result = await workspacesService.updateWorkspace(workspace_id, req.body)
  return res.json({ message: WORKSPACES_MESSAGES.UPDATE_WORKSPACE_SUCCESS, result })
}

export const deleteWorkspaceController = async (req: Request<WorkspaceParams, any, any>, res: Response) => {
  const { workspace_id } = req.params

  await workspacesService.deleteWorkspace(workspace_id)

  return res.json({ message: WORKSPACES_MESSAGES.DELETE_WORKSPACE_SUCCESS })
}
