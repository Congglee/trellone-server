import { Router } from 'express'
import { changePasswordController, getMeController, updateMeController } from '~/controllers/users.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { filterMiddleware } from '~/middlewares/common.middlewares'
import { changePasswordValidator, updateMeValidator } from '~/middlewares/users.middlewares'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

usersRouter.patch(
  '/me',
  accessTokenValidator,
  updateMeValidator,
  filterMiddleware<UpdateMeReqBody>(['display_name', 'avatar']),
  wrapRequestHandler(updateMeController)
)

usersRouter.put(
  '/change-password',
  accessTokenValidator,
  changePasswordValidator,
  wrapRequestHandler(changePasswordController)
)

export default usersRouter
