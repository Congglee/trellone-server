import { Router } from 'express'
import { createWorkspaceController } from '~/controllers/workspaces.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { verifiedUserValidator } from '~/middlewares/users.middlewares'
import { createWorkspaceValidator } from '~/middlewares/workspaces.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const workspacesRouter = Router()

workspacesRouter.post(
  '/',
  accessTokenValidator,
  verifiedUserValidator,
  createWorkspaceValidator,
  wrapRequestHandler(createWorkspaceController)
)

export default workspacesRouter
