import { Router } from 'express'
import {
  changePasswordController,
  enablePasswordLoginController,
  getMeController,
  updateMeController
} from '~/controllers/users.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import {
  changePasswordValidator,
  enablePasswordLoginUserValidator,
  enablePasswordLoginValidator,
  updateMeValidator,
  verifiedUserValidator
} from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  verifiedUserValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>(['display_name', 'avatar']),
  wrapRequestHandler(updateMeController)
)

usersRouter.put(
  '/change-password',
  accessTokenValidator,
  verifiedUserValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

usersRouter.post(
  '/enable-password-login',
  accessTokenValidator,
  verifiedUserValidator,
  enablePasswordLoginValidator,
  enablePasswordLoginUserValidator,
  wrapRequestHandler(enablePasswordLoginController)
)

export default usersRouter
