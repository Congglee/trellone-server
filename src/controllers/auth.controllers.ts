import { ParamsDictionary } from 'express-serve-static-core'
import { NextFunction, Request, Response } from 'express'
import { AUTH_MESSAGES } from '~/constants/messages'
import { LoginReqBody, RegisterReqBody, TokenPayload, VerifyEmailReqBody } from '~/models/requests/User.requests'
import authService from '~/services/auth.services'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import ms from 'ms'
import databaseService from '~/services/database.services'
import HTTP_STATUS from '~/constants/httpStatus'

export const registerController = async (req: Request<ParamsDictionary, any, RegisterReqBody>, res: Response) => {
  const result = await authService.register(req.body)
  return res.json({ message: AUTH_MESSAGES.REGISTER_SUCCESS, result })
}

export const loginController = async (req: Request<ParamsDictionary, any, LoginReqBody>, res: Response) => {
  const user = req.user as User
  const user_id = user._id as ObjectId

  const result = await authService.login({ user_id: user_id.toString(), verify: user.verify })

  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  return res.json({ message: AUTH_MESSAGES.LOGIN_SUCCESS, result })
}

export const logoutController = async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies

  const result = await authService.logout(refresh_token)

  res.clearCookie('access_token')
  res.clearCookie('refresh_token')

  return res.json(result)
}

export const refreshTokenController = async (req: Request, res: Response) => {
  const { refresh_token } = req.cookies
  const { user_id, verify, exp } = req.decoded_refresh_token as TokenPayload

  const result = await authService.refreshToken({ user_id, verify, refresh_token, exp })

  res.cookie('access_token', result.access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  res.cookie('refresh_token', result.refresh_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('7 days')
  })

  return res.json({ message: AUTH_MESSAGES.REFRESH_TOKEN_SUCCESS, result })
}

export const verifyEmailController = async (req: Request<ParamsDictionary, any, VerifyEmailReqBody>, res: Response) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (!user) {
    return res.status(HTTP_STATUS.NOT_FOUND).json({
      message: AUTH_MESSAGES.USER_NOT_FOUND
    })
  }

  if (user.email_verify_token === '') {
    return res.json({ message: AUTH_MESSAGES.EMAIL_ALREADY_VERIFIED_BEFORE })
  }

  const result = await authService.verifyEmail(user_id)

  return res.json(result)
}
