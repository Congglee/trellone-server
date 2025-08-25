import { Router } from 'express'
import {
  addGuestToWorkspaceController,
  createWorkspaceController,
  deleteWorkspaceController,
  editWorkspaceMemberRoleController,
  getWorkspaceController,
  getWorkspacesController,
  leaveWorkspaceController,
  removeGuestFromBoardController,
  removeGuestFromWorkspaceController,
  removeWorkspaceMemberController,
  removeWorkspaceMemberFromBoardController,
  updateWorkspaceController
} from '~/controllers/workspaces.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import {
  editWorkspaceMemberRoleValidator,
  createWorkspaceValidator,
  updateWorkspaceValidator,
  workspaceIdValidator,
  workspaceMemberIdValidator,
  leaveWorkspaceValidator,
  removeWorkspaceMemberValidator,
  removeWorkspaceMemberFromBoardValidator,
  workspaceGuestIdValidator,
  removeGuestFromBoardValidator
} from '~/middlewares/workspaces.middlewares'
import { UpdateWorkspaceReqBody } from '~/models/requests/Workspace.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { requireWorkspacePermission } from '~/middlewares/rbac.middlewares'
import { WorkspacePermission } from '~/constants/permissions'

const workspacesRouter = Router()

workspacesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createWorkspaceValidator,
  wrapRequestHandler(createWorkspaceController)
)

workspacesRouter.get('/', accessTokenValidator, paginationValidator, wrapRequestHandler(getWorkspacesController))

workspacesRouter.get(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  requireWorkspacePermission(WorkspacePermission.ViewWorkspace),
  wrapRequestHandler(getWorkspaceController)
)

workspacesRouter.put(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  updateWorkspaceValidator,
  filterMiddleware<UpdateWorkspaceReqBody>(['title', 'description', 'type', 'logo']),
  requireWorkspacePermission(WorkspacePermission.ManageWorkspace),
  wrapRequestHandler(updateWorkspaceController)
)

workspacesRouter.put(
  '/:workspace_id/members/:user_id/role',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceMemberIdValidator,
  editWorkspaceMemberRoleValidator,
  requireWorkspacePermission(WorkspacePermission.ManageMembers),
  wrapRequestHandler(editWorkspaceMemberRoleController)
)

workspacesRouter.post(
  '/:workspace_id/members/me/leave',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  leaveWorkspaceValidator,
  wrapRequestHandler(leaveWorkspaceController)
)

workspacesRouter.delete(
  '/:workspace_id/members/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceMemberIdValidator,
  removeWorkspaceMemberValidator,
  requireWorkspacePermission(WorkspacePermission.ManageMembers),
  wrapRequestHandler(removeWorkspaceMemberController)
)

workspacesRouter.delete(
  '/:workspace_id/members/:user_id/boards',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceMemberIdValidator,
  removeWorkspaceMemberFromBoardValidator,
  requireWorkspacePermission(WorkspacePermission.ManageMembers),
  wrapRequestHandler(removeWorkspaceMemberFromBoardController)
)

workspacesRouter.post(
  '/:workspace_id/guests/:user_id/add-to-workspace',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceGuestIdValidator,
  requireWorkspacePermission(WorkspacePermission.ManageGuests),
  wrapRequestHandler(addGuestToWorkspaceController)
)

workspacesRouter.delete(
  '/:workspace_id/guests/:user_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceGuestIdValidator,
  requireWorkspacePermission(WorkspacePermission.ManageGuests),
  wrapRequestHandler(removeGuestFromWorkspaceController)
)

workspacesRouter.delete(
  '/:workspace_id/guests/:user_id/boards',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  workspaceGuestIdValidator,
  removeGuestFromBoardValidator,
  requireWorkspacePermission(WorkspacePermission.ManageGuests),
  wrapRequestHandler(removeGuestFromBoardController)
)

workspacesRouter.delete(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  requireWorkspacePermission(WorkspacePermission.DeleteWorkspace),
  wrapRequestHandler(deleteWorkspaceController)
)

export default workspacesRouter
