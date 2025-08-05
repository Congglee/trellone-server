import { Router } from 'express'
import {
  createWorkspaceController,
  deleteWorkspaceController,
  getWorkspaceController,
  getWorkspacesController,
  updateWorkspaceController
} from '~/controllers/workspaces.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware, paginationValidator } from '~/middlewares/common.middlewares'
import { requireWorkspacePermission } from '~/middlewares/rbac.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import {
  createWorkspaceValidator,
  updateWorkspaceValidator,
  workspaceIdValidator
} from '~/middlewares/workspaces.middlewares'
import { UpdateWorkspaceReqBody } from '~/models/requests/Workspace.requests'
import { wrapRequestHandler } from '~/utils/handlers'

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
  wrapRequestHandler(getWorkspaceController)
)

workspacesRouter.put(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  requireWorkspacePermission(['workspace:update']),
  updateWorkspaceValidator,
  filterMiddleware<UpdateWorkspaceReqBody>(['title', 'description', 'type', 'logo']),
  wrapRequestHandler(updateWorkspaceController)
)

workspacesRouter.delete(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  requireWorkspacePermission(['workspace:delete']),
  wrapRequestHandler(deleteWorkspaceController)
)

export default workspacesRouter
