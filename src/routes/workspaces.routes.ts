import { Router } from 'express'
import { createWorkspaceController, getWorkspaceController } from '~/controllers/workspaces.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { createWorkspaceValidator, workspaceIdValidator } from '~/middlewares/workspaces.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const workspacesRouter = Router()

workspacesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createWorkspaceValidator,
  wrapRequestHandler(createWorkspaceController)
)

workspacesRouter.get(
  '/:workspace_id',
  accessTokenValidator,
  verifiedUserValidator,
  workspaceIdValidator,
  wrapRequestHandler(getWorkspaceController)
)

export default workspacesRouter
