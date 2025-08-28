import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import {
  CreateWorkspaceReqBody,
  EditWorkspaceMemberRoleReqBody,
  RemoveGuestFromBoardReqBody,
  RemoveWorkspaceMemberFromBoardReqBody,
  UpdateWorkspaceReqBody,
  WorkspaceBoardParams,
  WorkspaceGuestParams,
  WorkspaceMemberParams,
  WorkspaceParams
} from '~/models/requests/Workspace.requests'
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

export const editWorkspaceMemberRoleController = async (
  req: Request<WorkspaceMemberParams, any, EditWorkspaceMemberRoleReqBody>,
  res: Response
) => {
  const { workspace_id, user_id } = req.params

  const result = await workspacesService.editWorkspaceMemberRole(workspace_id, user_id, req.body)

  return res.json({ message: WORKSPACES_MESSAGES.EDIT_WORKSPACE_MEMBER_ROLE_SUCCESS, result })
}

export const leaveWorkspaceController = async (req: Request<WorkspaceParams>, res: Response) => {
  const { workspace_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await workspacesService.leaveWorkspace(workspace_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.LEAVE_WORKSPACE_SUCCESS, result })
}

export const removeWorkspaceMemberController = async (req: Request<WorkspaceMemberParams>, res: Response) => {
  const { workspace_id, user_id } = req.params

  const result = await workspacesService.removeWorkspaceMember(workspace_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.REMOVE_WORKSPACE_MEMBER_SUCCESS, result })
}

export const removeWorkspaceMemberFromBoardController = async (
  req: Request<WorkspaceMemberParams, any, RemoveWorkspaceMemberFromBoardReqBody>,
  res: Response
) => {
  const { workspace_id, user_id } = req.params
  const board_id = req.body.board_id

  const result = await workspacesService.removeWorkspaceMemberFromBoard(workspace_id, board_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.REMOVE_WORKSPACE_MEMBER_FROM_BOARD_SUCCESS, result })
}

export const addGuestToWorkspaceController = async (req: Request<WorkspaceGuestParams>, res: Response) => {
  const { workspace_id, user_id } = req.params

  const result = await workspacesService.addGuestToWorkspace(workspace_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.ADD_GUEST_TO_WORKSPACE_SUCCESS, result })
}

export const removeGuestFromWorkspaceController = async (req: Request<WorkspaceGuestParams>, res: Response) => {
  const { workspace_id, user_id } = req.params

  const result = await workspacesService.removeGuestFromWorkspace(workspace_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.REMOVE_GUEST_FROM_WORKSPACE_SUCCESS, result })
}

export const removeGuestFromBoardController = async (
  req: Request<WorkspaceGuestParams, any, RemoveGuestFromBoardReqBody>,
  res: Response
) => {
  const { workspace_id, user_id } = req.params
  const board_id = req.body.board_id

  const result = await workspacesService.removeGuestFromBoard(workspace_id, board_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.REMOVE_GUEST_FROM_BOARD_SUCCESS, result })
}

export const deleteWorkspaceController = async (req: Request<WorkspaceParams>, res: Response) => {
  const { workspace_id } = req.params

  await workspacesService.deleteWorkspace(workspace_id)

  return res.json({ message: WORKSPACES_MESSAGES.DELETE_WORKSPACE_SUCCESS })
}

export const joinWorkspaceBoardController = async (req: Request<WorkspaceBoardParams>, res: Response) => {
  const { board_id } = req.params
  const { user_id } = req.decoded_authorization as TokenPayload

  const result = await workspacesService.joinWorkspaceBoard(board_id, user_id)

  return res.json({ message: WORKSPACES_MESSAGES.JOIN_WORKSPACE_BOARD_SUCCESS, result })
}
