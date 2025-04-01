import { checkSchema, ParamSchema } from 'express-validator'
import { USERS_MESSAGES } from '~/constants/messages'
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
