import axios from 'axios'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { TokenType, UserVerifyStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { AUTH_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
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

  private async getOauthGoogleToken(code: string) {
    const body = {
      code,
      client_id: envConfig.googleClientId,
      client_secret: envConfig.googleClientSecret,
      redirect_uri: envConfig.googleRedirectUri,
      grant_type: 'authorization_code'
    }

    const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    return data as { access_token: string; id_token: string }
  }

  private async getGoogleUserInfo(access_token: string, id_token: string) {
    const { data } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      params: { access_token, alt: 'json' },
      headers: { Authorization: `Bearer ${id_token}` }
    })

    return data as {
      id: string
      email: string
      verified_email: boolean
      name: string
      given_name: string
      family_name: string
      picture: string
      locale: string
    }
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

  async resendVerifyEmail(user_id: string, email: string) {
    const email_verify_token = await this.signEmailVerifyToken({
      user_id,
      verify: UserVerifyStatus.Unverified
    })

    await sendVerifyRegisterEmail(email, email_verify_token)

    await databaseService.users.updateOne(
      { _id: new ObjectId(user_id) },
      {
        $set: { email_verify_token },
        $currentDate: { updated_at: true }
      }
    )

    return { message: AUTH_MESSAGES.RESEND_EMAIL_VERIFY_SUCCESS }
  }

  async forgotPassword({ user_id, email, verify }: { user_id: string; email: string; verify: UserVerifyStatus }) {
    const forgot_password_token = await this.signForgotPasswordToken({ user_id, verify })

    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      { $set: { forgot_password_token, updated_at: '$$NOW' } }
    ])

    await sendForgotPasswordEmail(email, forgot_password_token)

    return { message: AUTH_MESSAGES.CHECK_EMAIL_TO_RESET_PASSWORD }
  }

  async verifyForgotPassword(user_id: string) {
    await databaseService.users.updateOne({ _id: new ObjectId(user_id) }, [
      { $set: { forgot_password_token: '', updated_at: '$$NOW' } }
    ])

    return { message: AUTH_MESSAGES.VERIFY_FORGOT_PASSWORD_SUCCESS }
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

  async oauth(code: string) {
    const { id_token, access_token } = await this.getOauthGoogleToken(code)
    const userInfo = await this.getGoogleUserInfo(access_token, id_token)

    if (!userInfo.verified_email) {
      throw new ErrorWithStatus({ message: AUTH_MESSAGES.GMAIL_NOT_VERIFIED, status: HTTP_STATUS.BAD_REQUEST })
    }

    const user = await databaseService.users.findOne({ email: userInfo.email })

    if (user) {
      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user._id.toString(),
        verify: UserVerifyStatus.Verified
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refreshTokens.insertOne(
        new RefreshToken({ user_id: new ObjectId(user._id), token: refresh_token, iat, exp })
      )

      if (user.verify !== UserVerifyStatus.Verified) {
        await databaseService.users.updateOne(
          { _id: user._id },
          {
            $set: { verify: UserVerifyStatus.Verified },
            $currentDate: { updated_at: true }
          }
        )
      }

      return { access_token, refresh_token, newUser: 0, verify: UserVerifyStatus.Verified }
    } else {
      const user_id = new ObjectId()
      const password = Math.random().toString(36).substring(2, 15)
      const nameFromEmail = userInfo.email.split('@')[0]

      await databaseService.users.insertOne(
        new User({
          _id: user_id,
          email: userInfo.email,
          password: hashPassword(password),
          username: nameFromEmail,
          display_name: userInfo.name || nameFromEmail,
          avatar: userInfo.picture || '',
          verify: UserVerifyStatus.Verified,
          email_verify_token: ''
        })
      )

      const [access_token, refresh_token] = await this.signAccessAndRefreshToken({
        user_id: user_id.toString(),
        verify: UserVerifyStatus.Verified
      })
      const { iat, exp } = await this.decodeRefreshToken(refresh_token)

      await databaseService.refreshTokens.insertOne(new RefreshToken({ user_id, token: refresh_token, iat, exp }))

      return { access_token, refresh_token, newUser: 1, verify: UserVerifyStatus.Verified }
    }
  }
}

const authService = new AuthService()

export default authService
