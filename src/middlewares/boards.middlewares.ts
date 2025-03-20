import { validate } from '~/utils/validation'
import { checkSchema, ParamSchema } from 'express-validator'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { stringEnumToArray } from '~/utils/commons'
import { BoardType } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { Request } from 'express'
import Board from '~/models/schemas/Board.schema'
import { envConfig } from '~/config/environment'
import { isEmpty } from 'lodash'

const boardTypes = stringEnumToArray(BoardType)

const boardTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_IS_REQUIRED },
  isString: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 3, max: 50 },
    errorMessage: BOARDS_MESSAGES.BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
  }
}

const boardDescriptionSchema: ParamSchema = {
  optional: true,
  isString: { errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 3, max: 256 },
    errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_MUST_BE_BETWEEN_3_AND_256
  }
}

const boardTypeSchema: ParamSchema = {
  isIn: {
    options: [boardTypes],
    errorMessage: BOARDS_MESSAGES.BOARD_TYPE_MUST_BE_PUBLIC_OR_PRIVATE
  }
}

export const createBoardValidator = validate(
  checkSchema(
    {
      title: boardTitleSchema,
      description: boardDescriptionSchema,
      type: boardTypeSchema
    },
    ['body']
  )
)

export const boardIdValidator = validate(
  checkSchema(
    {
      board_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: BOARDS_MESSAGES.INVALID_BOARD_ID
              })
            }

            const [board] = await databaseService.boards
              .aggregate<Board>([
                {
                  $match: {
                    _id: new ObjectId(value),
                    _destroy: false
                  }
                },
                {
                  $lookup: {
                    from: envConfig.dbColumnsCollection,
                    localField: '_id',
                    foreignField: 'board_id',
                    as: 'columns'
                  }
                },
                {
                  $lookup: {
                    from: envConfig.dbCardsCollection,
                    localField: '_id',
                    foreignField: 'board_id',
                    as: 'cards'
                  }
                },
                {
                  $addFields: {
                    columns: {
                      $map: {
                        input: '$columns',
                        as: 'column',
                        in: {
                          $mergeObjects: [
                            '$$column',
                            {
                              cards: {
                                $filter: {
                                  input: '$cards',
                                  as: 'card',
                                  cond: { $eq: ['$$card.column_id', '$$column._id'] }
                                }
                              }
                            }
                          ]
                        }
                      }
                    }
                  }
                },
                {
                  $project: { cards: 0 }
                }
              ])
              .toArray()

            if (!board) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: BOARDS_MESSAGES.BOARD_NOT_FOUND
              })
            }

            ;(req as Request).board = board

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const updateBoardValidator = validate(
  checkSchema(
    {
      title: { ...boardTitleSchema, optional: true, notEmpty: undefined },
      description: boardDescriptionSchema,
      type: { ...boardTypeSchema, optional: true },
      column_order_ids: {
        isArray: { errorMessage: BOARDS_MESSAGES.COLUMN_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value, { req }) => {
            const board = (req as Request).board as Board

            // If value is empty, check if the board already had an empty column_order_ids
            if (isEmpty(value)) {
              // Only allow empty array if it was already empty
              if (!isEmpty(board.column_order_ids)) {
                throw new Error(BOARDS_MESSAGES.COLUMN_ORDER_IDS_CANNOT_BE_EMPTY)
              }
              return true
            }

            // Check if all IDs are valid ObjectIds
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(BOARDS_MESSAGES.INVALID_BOARD_ID)
            }

            // Ensure no new elements added or removed (only reordering allowed)
            if (!isEmpty(board.column_order_ids)) {
              // Convert both arrays to sets of string IDs and compare
              const existingIds = new Set(board.column_order_ids.map((id) => id.toString()))
              const newIds = new Set(value.map((id: string) => id.toString()))

              // Check if both sets have the same size and elements
              if (existingIds.size !== newIds.size) {
                throw new Error('You can only reorder columns, not add or remove them')
              }

              // Check if every element in newIds exists in existingIds
              for (const id of newIds) {
                if (!existingIds.has(id as string)) {
                  throw new Error('You can only reorder columns, not add or remove them')
                }
              }
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
