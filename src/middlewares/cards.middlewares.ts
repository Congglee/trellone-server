import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { CARDS_MESSAGES } from '~/constants/messages'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createCardValidator = validate(
  checkSchema(
    {
      title: {
        notEmpty: { errorMessage: CARDS_MESSAGES.CARD_TITLE_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.CARD_TITLE_MUST_BE_STRING },
        trim: true,
        isLength: {
          options: { min: 3, max: 50 },
          errorMessage: CARDS_MESSAGES.CARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
        }
      },
      board_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_BOARD_ID)
            }

            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value),
              _destroy: false
            })

            if (!board) {
              throw new Error(CARDS_MESSAGES.BOARD_NOT_FOUND)
            }

            return true
          }
        }
      },
      column_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.COLUMN_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_COLUMN_ID)
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value),
              _destroy: false
            })

            if (!column) {
              throw new Error(CARDS_MESSAGES.COLUMN_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
