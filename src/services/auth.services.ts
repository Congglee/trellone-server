import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import { AUTH_MESSAGES } from '~/constants/messages'
import { RegisterReqBody } from '~/models/requests/User.requests'
import RefreshToken from '~/models/schemas/RefreshToken.schema'
import User from '~/models/schemas/User.schema'
import { sendForgotPasswordEmail, sendVerifyRegisterEmail } from '~/providers/resend'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { signToken, verifyToken } from '~/utils/jwt'

class AuthService {
  private signAccessToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.AccessToken, verify },
      privateKey: envConfig.jwtSecretAccessToken as string,
      options: { expiresIn: envConfig.accessTokenExpiresIn }
    })
  }

  private signRefreshToken({ user_id, verify, exp }: { user_id: string; verify: UserVerifyStatus; exp?: number }) {
    if (exp) {
      return signToken({
        payload: { user_id, token_type: TokenType.RefreshToken, verify, exp },
        privateKey: envConfig.jwtSecretRefreshToken as string
      })
    }

    return signToken({
      payload: { user_id, token_type: TokenType.RefreshToken, verify },
      privateKey: envConfig.jwtSecretRefreshToken as string,
      options: { expiresIn: envConfig.refreshTokenExpiresIn }
    })
  }

  private signAccessAndRefreshToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return Promise.all([this.signAccessToken({ user_id, verify }), this.signRefreshToken({ user_id, verify })])
  }

  private signEmailVerifyToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.EmailVerifyToken, verify },
      privateKey: envConfig.jwtSecretEmailVerifyToken as string,
      options: { expiresIn: envConfig.emailVerifyTokenExpiresIn }
    })
  }

  private signForgotPasswordToken({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    return signToken({
      payload: { user_id, token_type: TokenType.ForgotPasswordToken, verify },
      privateKey: envConfig.jwtSecretForgotPasswordToken as string,
      options: { expiresIn: envConfig.forgotPasswordTokenExpiresIn }
    })
  }

  private decodeRefreshToken(refresh_token: string) {
    return verifyToken({ token: refresh_token, secretOrPublicKey: envConfig.jwtSecretRefreshToken as string })
  }

  async checkEmailExist(email: string) {
    const user = await databaseService.users.findOne({ email })
    return Boolean(user)
  }

  async register(body: RegisterReqBody) {
    const user_id = new ObjectId()

    const email_verify_token = await this.signEmailVerifyToken({
      user_id: user_id.toString(),
      verify: UserVerifyStatus.Unverified
    })

    const nameFromEmail = body.email.split('@')[0]

    await databaseService.users.insertOne(
      new User({
        ...body,
        _id: user_id,
        email_verify_token,
        password: hashPassword(body.password),
        username: nameFromEmail,
        display_name: nameFromEmail
      })
    )

    await sendVerifyRegisterEmail(body.email, email_verify_token)

    return { message: AUTH_MESSAGES.REGISTER_SUCCESS }
  }

  async login({ user_id, verify }: { user_id: string; verify: UserVerifyStatus }) {
    const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
      user_id: user_id.toString(),
      verify
    })

    const { iat, exp } = await this.decodeRefreshToken(refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({ user_id: new ObjectId(user_id), token: refresh_token, iat, exp })
    )

    return { access_token, refresh_token }
  }

  async logout(refresh_token: string) {
    await databaseService.refreshTokens.deleteOne({ token: refresh_token })
    return { message: AUTH_MESSAGES.LOGOUT_SUCCESS }
  }

  async refreshToken({
    user_id,
    verify,
    refresh_token,
    exp
  }: {
    user_id: string
    verify: UserVerifyStatus
    refresh_token: string
    exp: number
  }) {
    const [new_access_token, new_refresh_token] = await Promise.all([
      this.signAccessToken({ user_id, verify }),
      this.signRefreshToken({ user_id, verify }),
      databaseService.refreshTokens.deleteOne({ token: refresh_token })
    ])
    const decoded_refresh_token = await this.decodeRefreshToken(new_refresh_token)

    await databaseService.refreshTokens.insertOne(
      new RefreshToken({
        user_id: new ObjectId(user_id),
        token: new_refresh_token,
        iat: decoded_refresh_token.iat,
        exp: decoded_refresh_token.exp
      })
    )

    return { access_token: new_access_token, refresh_token: new_refresh_token }
  }

  async verifyEmail(user_id: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      {
        $set: {
          email_verify_token: '',
          verify: UserVerifyStatus.Verified,
          updated_at: '$$NOW'
        }
      }
    ])

    return { message: AUTH_MESSAGES.EMAIL_VERIFY_SUCCESS }
  }

  async forgotPassword({ user_id, email, verify }: { user_id: string; email: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      { $set: { forgot_password_token, updated_at: '$$NOW' } }
    ])

    await sendForgotPasswordEmail(email, forgot_password_token)

    return { message: AUTH_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async resetPassword(user_id: string, password: string) {
    databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { forgot_password_token: '', password: hashPassword(password) },
        $currentDate: { updated_at: true }
      }
    )

    return { message: AUTH_MESSAGES.RESET_PASSWORD_SUCCESS }
  }
}

const authService = new AuthService()

export default authService
