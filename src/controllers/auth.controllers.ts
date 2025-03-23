import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { AUTH_MESSAGES } from '~/constants/messages'
import { LoginReqBody, RegisterReqBody } from '~/models/requests/User.requests'
import authService from '~/services/auth.services'
import User from '~/models/schemas/User.schema'
import { ObjectId } from 'mongodb'
import ms from 'ms'

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
