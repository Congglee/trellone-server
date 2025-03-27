import { Router } from 'express'
import {
  forgotPasswordController,
  loginController,
  logoutController,
  refreshTokenController,
  registerController,
  resetPasswordController,
  verifyEmailController,
  verifyForgotPasswordController
} from '~/controllers/auth.controllers'
import {
  emailVerifyTokenValidator,
  forgotPasswordValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator,
  resetPasswordValidator,
  verifyForgotPasswordTokenValidator
} from '~/middlewares/auth.middlewares'
import { wrapRequestHandler } from '~/utils/handlers'

const authRouter = Router()

authRouter.post('/register', registerValidator, wrapRequestHandler(registerController))

authRouter.post('/login', loginValidator, wrapRequestHandler(loginController))

authRouter.post('/logout', wrapRequestHandler(logoutController))

authRouter.post('/refresh-token', refreshTokenValidator, wrapRequestHandler(refreshTokenController))

authRouter.post('/verify-email', emailVerifyTokenValidator, wrapRequestHandler(verifyEmailController))

authRouter.post('/forgot-password', forgotPasswordValidator, wrapRequestHandler(forgotPasswordController))

authRouter.post(
  '/verify-forgot-password',
  verifyForgotPasswordTokenValidator,
  wrapRequestHandler(verifyForgotPasswordController)
)

authRouter.post('/reset-password', resetPasswordValidator, wrapRequestHandler(resetPasswordController))

export default authRouter
