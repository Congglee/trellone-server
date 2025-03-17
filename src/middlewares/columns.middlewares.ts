import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { COLUMNS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createColumnValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_IS_REQUIRED },
        isString: { errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
        }
      },
      board_id: {
        notEmpty: { errorMessage: COLUMNS_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: COLUMNS_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(COLUMNS_MESSAGES.INVALID_BOARD_ID)
            }

            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value),
              _destroy: false
            })

            if (!board) {
              throw new Error(COLUMNS_MESSAGES.BOARD_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
