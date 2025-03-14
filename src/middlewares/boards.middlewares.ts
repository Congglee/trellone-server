import { validate } from '~/utils/validation'
import { checkSchema } from 'express-validator'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { stringEnumToArray } from '~/utils/commons'
import { BoardType } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'

const boardTypes = stringEnumToArray(BoardType)

export const createBoardValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: BOARDS_MESSAGES.BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
        }
      },
      description: {
        optional: true,
        isString: { errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 256 },
          errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_MUST_BE_BETWEEN_3_AND_256
        }
      },
      type: {
        isIn: {
          options: [boardTypes],
          errorMessage: BOARDS_MESSAGES.BOARD_TYPE_MUST_BE_PUBLIC_OR_PRIVATE
        }
      }
    },
    ['body']
  )
)

export const boardIdValidator = validate(
  checkSchema(
    {
      board_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: BOARDS_MESSAGES.INVALID_BOARD_ID
              })
            }

            return true
          }
        }
      }
    },
    ['params']
  )
)
