import { ObjectId } from 'mongodb'
import { AUTH_MESSAGES } from '~/constants/messages'
import { USERS_MESSAGES } from '~/constants/messages'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'

class UsersService {
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 } }
    )

    return user
  }

  async updateMe(user_id: string, body: UpdateMeReqBody) {
    const user = await databaseService.users.findOneAndUpdate(
      { _id: new ObjectId(user_id) },
      {
        $set: body,
        $currentDate: { updated_at: true }
      },
      {
        returnDocument: 'after',
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0, google_id: 0 }
      }
    )

    return user
  }

  async changePassword(user_id: string, new_password: string) {
    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { password: hashPassword(new_password) },
        $currentDate: { updated_at: true }
      }
    )

    return { message: USERS_MESSAGES.CHANGE_PASSWORD_SUCCESS }
  }

  async enablePasswordLogin(user_id: string, password: string) {
    const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

    const payload: any = {
      password: hashPassword(password),
      is_password_login_enabled: true
    }

    if (!user!.auth_providers.includes('password')) {
      payload.auth_providers = [...user!.auth_providers, 'password']
    }

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: payload,
        $currentDate: { updated_at: true }
      }
    )

    return { message: AUTH_MESSAGES.ENABLE_PASSWORD_LOGIN_SUCCESS }
  }
}

const usersService = new UsersService()

export default usersService
