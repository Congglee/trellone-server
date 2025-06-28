import { Request } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { isEmpty } from 'lodash'
import { ObjectId } from 'mongodb'
import HTTP_STATUS from '~/constants/httpStatus'
import { COLUMNS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Column from '~/models/schemas/Column.schema'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

const columnTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_IS_REQUIRED },
  isString: { errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 3, max: 50 },
    errorMessage: COLUMNS_MESSAGES.COLUMN_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
  }
}

export const createColumnValidator = validate(
  checkSchema(
    {
      title: columnTitleSchema,
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
              _id: new ObjectId(value)
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

export const columnIdValidator = validate(
  checkSchema(
    {
      column_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: COLUMNS_MESSAGES.INVALID_COLUMN_ID
              })
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value)
            })

            if (!column) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: COLUMNS_MESSAGES.COLUMN_NOT_FOUND
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const isUserColumnOwner = await databaseService.boards.countDocuments({
              _id: column.board_id,
              $or: [
                {
                  owners: { $in: [new ObjectId(user_id)] }
                },
                {
                  members: { $in: [new ObjectId(user_id)] }
                }
              ]
            })

            if (!isUserColumnOwner) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.FORBIDDEN,
                message: COLUMNS_MESSAGES.COLUMN_NOT_BELONG_TO_USER
              })
            }

            ;(req as Request).column = column

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const updateColumnValidator = validate(
  checkSchema(
    {
      title: { ...columnTitleSchema, optional: true, notEmpty: undefined },
      card_order_ids: {
        optional: true,
        isArray: { errorMessage: COLUMNS_MESSAGES.CARD_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value, { req }) => {
            const column = (req as Request).column as Column

            // If the card_order_ids value is empty, check if the column already had an empty card_order_ids
            if (isEmpty(value)) {
              // Only allow empty array if it was empty before
              if (!isEmpty(column.card_order_ids)) {
                throw new Error(COLUMNS_MESSAGES.CARD_ORDER_IDS_CANNOT_BE_EMPTY)
              }

              return true
            }

            // Check if all IDs in the card_order_ids array are valid ObjectIds
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(COLUMNS_MESSAGES.INVALID_CARD_ID)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
