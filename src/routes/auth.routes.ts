import { Router } from 'express'
import { registerController } from '~/controllers/auth.controllers'
import { registerValidator } from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const authRouter = Router()

authRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

export default authRouter
