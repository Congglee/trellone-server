import { NextFunction, Request, Response } from 'express'
import axios from 'axios'
import { checkSchema, ParamSchema } from 'express-validator'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import HTTP_STATUS from '~/constants/httpStatus'
import { AUTH_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { AUTH_ERROR_CODES } from '~/constants/error-codes'
import { TokenPayload } from '~/models/requests/User.requests'
import authService from '~/services/auth.services'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { verifyAccessToken, verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'
import { GoogleTokens } from '~/models/Extensions'

export const passwordSchema: ParamSchema = {
  notEmpty: { errorMessage: AUTH_MESSAGES.PASSWORD_IS_REQUIRED },
  isString: { errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRING },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: AUTH_MESSAGES.PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_50
  },
  isStrongPassword: {
    options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    errorMessage: AUTH_MESSAGES.PASSWORD_MUST_BE_STRONG
  }
}

export const confirmPasswordSchema: ParamSchema = {
  notEmpty: { errorMessage: AUTH_MESSAGES.CONFIRM_PASSWORD_IS_REQUIRED },
  isString: { errorMessage: AUTH_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRING },
  isLength: {
    options: { min: 6, max: 50 },
    errorMessage: AUTH_MESSAGES.CONFIRM_PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_50
  },
  isStrongPassword: {
    options: { minLength: 6, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
    errorMessage: AUTH_MESSAGES.CONFIRM_PASSWORD_MUST_BE_STRONG
  },
  custom: {
    options: (value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(AUTH_MESSAGES.CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD)
      }
      return true
    }
  }
}

const forgotPasswordTokenSchema: ParamSchema = {
  trim: true,
  custom: {
    options: async (value: string, { req }) => {
      if (!value) {
        throw new ErrorWithStatus({
          message: AUTH_MESSAGES.FORGOT_PASSWORD_TOKEN_IS_REQUIRED,
          status: HTTP_STATUS.UNAUTHORIZED
        })
      }

      try {
        const decoded_forgot_password_token = await verifyToken({
          token: value,
          secretOrPublicKey: envConfig.jwtSecretForgotPasswordToken as string
        })
        const { user_id } = decoded_forgot_password_token

        const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

        if (user === null) {
          throw new ErrorWithStatus({
            message: AUTH_MESSAGES.USER_NOT_FOUND,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        if (user.forgot_password_token !== value) {
          throw new ErrorWithStatus({
            message: AUTH_MESSAGES.INVALID_FORGOT_PASSWORD_TOKEN,
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        req.decoded_forgot_password_token = decoded_forgot_password_token
      } catch (error) {
        if (error instanceof JsonWebTokenError) {
          throw new ErrorWithStatus({
            message: capitalize(error.message),
            status: HTTP_STATUS.UNAUTHORIZED
          })
        }

        throw error
      }

      return true
    }
  }
}

export const registerValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value) => {
            const isExistEmail = await authService.checkEmailExist(value)

            if (isExistEmail) {
              throw new Error(AUTH_MESSAGES.EMAIL_ALREADY_EXISTS)
            }

            return true
          }
        }
      },
      password: passwordSchema,
      confirm_password: confirmPasswordSchema
    },
    ['body']
  )
)

export const loginValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })

            if (user === null) {
              throw new Error(AUTH_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            if (!user.is_password_login_enabled || !user.auth_providers.includes('password')) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.PASSWORD_LOGIN_NOT_ENABLED,
                status: HTTP_STATUS.BAD_REQUEST,
                error_code: AUTH_ERROR_CODES.PASSWORD_LOGIN_DISABLED
              })
            }

            const hashedPassword = hashPassword(req.body.password)
            if (user.password !== hashedPassword) {
              throw new Error(AUTH_MESSAGES.EMAIL_OR_PASSWORD_IS_INCORRECT)
            }

            ;(req as Request).user = user

            return true
          }
        }
      },
      password: passwordSchema
    },
    ['body']
  )
)

export const accessTokenValidator = validate(
  checkSchema(
    {
      Authorization: {
        notEmpty: { errorMessage: AUTH_MESSAGES.ACCESS_TOKEN_IS_REQUIRED },
        custom: {
          options: async (value, { req }) => {
            // Get token from cookies
            const cookie_token = req.headers?.cookie

            // If cookie token exists, use it to verify
            if (cookie_token) {
              const cookieEntries = cookie_token.split('; ')
              const accessTokenEntry = cookieEntries.find((entry: string) => entry.startsWith('access_token='))

              if (accessTokenEntry) {
                const access_token = accessTokenEntry.split('=')[1]
                return await verifyAccessToken(access_token, req as Request)
              }
            }

            // If cookie token does not exist, then use Authorization header to verify
            return await verifyAccessToken(value, req as Request)
          }
        }
      }
    },
    ['headers']
  )
)

export const refreshTokenValidator = validate(
  checkSchema(
    {
      refresh_token: {
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.REFRESH_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const [decoded_refresh_token, refresh_token] = await Promise.all([
                verifyToken({
                  token: value,
                  secretOrPublicKey: envConfig.jwtSecretRefreshToken as string
                }),
                databaseService.refreshTokens.findOne({ token: value })
              ])

              if (refresh_token === null) {
                throw new ErrorWithStatus({
                  message: AUTH_MESSAGES.USED_REFRESH_TOKEN_OR_NOT_EXIST,
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              ;(req as Request).decoded_refresh_token = decoded_refresh_token
            } catch (error) {
              if (error instanceof TokenExpiredError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED,
                  error_code: AUTH_ERROR_CODES.TOKEN_EXPIRED
                })
              }
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }
              throw error
            }

            return true
          }
        }
      }
    },
    ['cookies', 'body']
  )
)

export const emailVerifyTokenValidator = validate(
  checkSchema(
    {
      email_verify_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.EMAIL_VERIFY_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            try {
              const decoded_email_verify_token = await verifyToken({
                token: value,
                secretOrPublicKey: envConfig.jwtSecretEmailVerifyToken as string
              })

              ;(req as Request).decoded_email_verify_token = decoded_email_verify_token
            } catch (error) {
              throw new ErrorWithStatus({
                message: capitalize((error as JsonWebTokenError).message),
                status: HTTP_STATUS.UNAUTHORIZED
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const forgotPasswordValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })

            if (user === null) {
              throw new Error(AUTH_MESSAGES.USER_NOT_FOUND)
            }

            if (!user.is_password_login_enabled) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.PASSWORD_LOGIN_NOT_ENABLED_FORGOT_PASSWORD,
                status: HTTP_STATUS.BAD_REQUEST,
                error_code: AUTH_ERROR_CODES.PASSWORD_LOGIN_DISABLED
              })
            }

            ;(req as Request).user = user

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const verifyForgotPasswordTokenValidator = validate(
  checkSchema({ forgot_password_token: forgotPasswordTokenSchema }, ['body'])
)

export const resetPasswordValidator = validate(
  checkSchema(
    {
      password: passwordSchema,
      confirm_password: confirmPasswordSchema,
      forgot_password_token: forgotPasswordTokenSchema
    },
    ['body']
  )
)

export const resetPasswordUserValidator = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload

  const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

  if (!user) {
    return next(
      new ErrorWithStatus({
        message: AUTH_MESSAGES.USER_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      })
    )
  }

  ;(req as Request).user = user

  next()
}

export const OAuthValidator = validate(
  checkSchema(
    {
      code: {
        notEmpty: { errorMessage: AUTH_MESSAGES.OAUTH_CODE_IS_REQUIRED },
        isString: { errorMessage: AUTH_MESSAGES.OAUTH_CODE_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            try {
              const body = {
                code: value,
                client_id: envConfig.googleClientId,
                client_secret: envConfig.googleClientSecret,
                redirect_uri: envConfig.googleRedirectUri,
                grant_type: 'authorization_code'
              }

              const { data } = await axios.post('https://oauth2.googleapis.com/token', body, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
              })

              const { id_token, access_token } = data as GoogleTokens

              const { data: userInfo } = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
                params: { access_token, alt: 'json' },
                headers: { Authorization: `Bearer ${id_token}` }
              })

              if (!userInfo || !userInfo.id || !userInfo.email) {
                throw new ErrorWithStatus({
                  message: AUTH_MESSAGES.GOOGLE_USER_INFO_MISSING_ID_OR_EMAIL,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              if (!userInfo.verified_email) {
                throw new ErrorWithStatus({
                  message: AUTH_MESSAGES.GMAIL_NOT_VERIFIED,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              ;(req as Request).google_user_info = userInfo
              ;(req as Request).google_tokens = { id_token, access_token }

              return true
            } catch (error) {
              if (error instanceof ErrorWithStatus) {
                throw error
              }

              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.INVALID_OAUTH_CODE,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }
          }
        }
      }
    },
    ['query']
  )
)

export const resendVerifyEmailValidator = validate(
  checkSchema(
    {
      email: {
        isEmail: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        trim: true,
        notEmpty: { errorMessage: AUTH_MESSAGES.EMAIL_IS_INVALID },
        custom: {
          options: async (value, { req }) => {
            const user = await databaseService.users.findOne({ email: value })

            if (!user) {
              throw new ErrorWithStatus({
                message: AUTH_MESSAGES.USER_NOT_FOUND,
                status: HTTP_STATUS.NOT_FOUND
              })
            }

            ;(req as Request).user = user

            return true
          }
        }
      }
    },
    ['body']
  )
)
