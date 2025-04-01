import { ObjectId } from 'mongodb'
import { UpdateMeReqBody } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'

class UsersService {
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
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
        projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 }
      }
    )

    return user
  }
}

const usersService = new UsersService()

export default usersService
