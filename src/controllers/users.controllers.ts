import { Request, Response } from 'express'
import { USERS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import usersService from '~/services/users.services'

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const result = await usersService.getMe(user_id)

  return res.json({ message: USERS_MESSAGES.GET_ME_SUCCESS, result })
}
