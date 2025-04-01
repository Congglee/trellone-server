import { Request } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { USERS_MESSAGES } from '~/constants/messages'
import { confirmPasswordSchema, passwordSchema } from '~/middlewares/auth.middlewares'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import { hashPassword } from '~/utils/crypto'
import { validate } from '~/utils/validation'

const displayNameSchema: ParamSchema = {
  notEmpty: { errorMessage: USERS_MESSAGES.DISPLAY_NAME_IS_REQUIRED },
  isString: { errorMessage: USERS_MESSAGES.DISPLAY_NAME_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 1, max: 100 },
    errorMessage: USERS_MESSAGES.DISPLAY_NAME_LENGTH_MUST_BE_BETWEEN_1_AND_100
  }
}

export const imageSchema: ParamSchema = {
  optional: true,
  isString: { errorMessage: USERS_MESSAGES.IMAGE_URL_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 1, max: 400 },
    errorMessage: USERS_MESSAGES.IMAGE_URL_LENGTH_MUST_BE_BETWEEN_1_AND_400
  }
}

export const updateMeValidator = validate(
  checkSchema(
    {
      name: { ...displayNameSchema, optional: true, notEmpty: undefined },
      avatar: imageSchema
    },
    ['body']
  )
)

export const changePasswordValidator = validate(
  checkSchema({
    old_password: {
      ...passwordSchema,
      custom: {
        options: async (value: string, { req }) => {
          const { user_id } = (req as Request).decoded_authorization as TokenPayload

          const user = await databaseService.users.findOne({ _id: new ObjectId(user_id) })

          if (!user) {
            throw new ErrorWithStatus({
              message: USERS_MESSAGES.USER_NOT_FOUND,
              status: HTTP_STATUS.NOT_FOUND
            })
          }

          const { password } = user
          const isMatch = hashPassword(value) === password

          if (!isMatch) {
            throw new Error(USERS_MESSAGES.OLD_PASSWORD_NOT_MATCH)
          }
        }
      }
    },
    password: passwordSchema,
    confirm_password: confirmPasswordSchema
  })
)
