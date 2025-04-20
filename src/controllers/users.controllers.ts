import { ParamsDictionary } from 'express-serve-static-core'
import { Request, Response } from 'express'
import { USERS_MESSAGES } from '~/constants/messages'
import { ChangePasswordReqBody, TokenPayload, UpdateMeReqBody } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getMe(user_id)

  return res.json({ message: USERS_MESSAGES.GET_ME_SUCCESS, result })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeReqBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload

  const user = await usersService.updateMe(user_id, req.body)

  return res.json({ message: USERS_MESSAGES.UPDATE_ME_SUCCESS, result: user })
}

export const changePasswordController = async (
  req: Request<ParamsDictionary, any, ChangePasswordReqBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { password } = req.body

  const result = await usersService.changePassword(user_id, password)

  return res.json(result)
}
