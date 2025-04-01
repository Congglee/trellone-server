import { JwtPayload } from 'jsonwebtoken'
import { TokenType, UserVerifyStatus } from '~/constants/enums'

export interface RegisterReqBody {
  email: string
  password: string
  confirm_password: string
}

export interface LoginReqBody {
  email: string
  password: string
}

export interface TokenPayload extends JwtPayload {
  user_id: string
  token_type: TokenType
  verify: UserVerifyStatus
  exp: number
  iat: number
}

export interface VerifyEmailReqBody {
  email_verify_token: string
}

export interface ForgotPasswordReqBody {
  email: string
}

export interface VerifyForgotPasswordReqBody {
  forgot_password_token: string
}

export interface ResetPasswordReqBody {
  password: string
  confirm_password: string
  forgot_password_token: string
}

export interface UpdateMeReqBody {
  display_name?: string
  avatar?: string
}

export interface ChangePasswordReqBody {
  password: string
}
