import { Router } from 'express'
import { getMeController } from '~/controllers/users.controllers'
import { accessTokenValidator } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.get('/me', accessTokenValidator, wrapRequestHandler(getMeController))

export default usersRouter
