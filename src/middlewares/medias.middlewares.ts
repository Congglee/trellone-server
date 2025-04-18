import { checkSchema } from 'express-validator'
import { MEDIAS_MESSAGES } from '~/constants/messages'
import { validate } from '~/utils/validation'

export const unsplashSearchGetPhotosValidator = validate(
  checkSchema(
    {
      query: {
        notEmpty: {
          errorMessage: MEDIAS_MESSAGES.UNSPLASH_SEARCH_GET_PHOTOS_QUERY_IS_REQUIRED
        },
        isString: {
          errorMessage: MEDIAS_MESSAGES.UNSPLASH_SEARCH_GET_PHOTOS_QUERY_MUST_BE_STRING
        }
      }
    },
    ['query']
  )
)
