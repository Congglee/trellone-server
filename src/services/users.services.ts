import { ObjectId } from 'mongodb'
import databaseService from '~/services/database.services'

class UsersService {
  async getMe(user_id: string) {
    const user = await databaseService.users.findOne(
      { _id: new ObjectId(user_id) },
      { projection: { password: 0, email_verify_token: 0, forgot_password_token: 0 } }
    )

    return user
  }
}

const usersService = new UsersService()

export default usersService
