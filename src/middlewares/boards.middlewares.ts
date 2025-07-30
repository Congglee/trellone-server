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
import { TokenPayload } from '~/models/requests/User.requests'

const boardTypes = stringEnumToArray(BoardType)

const boardTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_IS_REQUIRED },
  isString: { errorMessage: BOARDS_MESSAGES.BOARD_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: BOARDS_MESSAGES.BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_1_AND_50
  }
}

const boardDescriptionSchema: ParamSchema = {
  optional: true,
  isString: { errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { max: 256 },
    errorMessage: BOARDS_MESSAGES.BOARD_DESCRIPTION_LENGTH_MUST_BE_LESS_THAN_256
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
      type: boardTypeSchema,
      workspace_id: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.WORKSPACE_ID_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.WORKSPACE_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOARDS_MESSAGES.INVALID_WORKSPACE_ID)
            }

            const workspace = await databaseService.workspaces.findOne({
              _id: new ObjectId(value)
            })

            if (!workspace) {
              throw new Error(BOARDS_MESSAGES.WORKSPACE_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const getBoardsValidator = validate(
  checkSchema(
    {
      keyword: {
        optional: true,
        isString: { errorMessage: BOARDS_MESSAGES.KEYWORD_MUST_BE_STRING }
      }
    },
    ['query']
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

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const queryConditions = [
              { _id: new ObjectId(value) },
              { _destroy: false },
              {
                $or: [
                  {
                    owners: { $all: [new ObjectId(user_id)] }
                  },
                  { members: { $all: [new ObjectId(user_id)] } }
                ]
              }
            ]

            const [board] = await databaseService.boards
              .aggregate<Board>([
                {
                  $match: { $and: queryConditions }
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
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'members',
                    foreignField: '_id',
                    as: 'members',
                    pipeline: [
                      {
                        $project: {
                          password: 0,
                          email_verify_token: 0,
                          forgot_password_token: 0
                        }
                      }
                    ]
                  }
                },
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'owners',
                    foreignField: '_id',
                    as: 'owners',
                    pipeline: [
                      {
                        $project: {
                          password: 0,
                          email_verify_token: 0,
                          forgot_password_token: 0
                        }
                      }
                    ]
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
        optional: true,
        isArray: { errorMessage: BOARDS_MESSAGES.COLUMN_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value, { req }) => {
            const board = (req as Request).board as Board

            // If the column_order_ids value is empty, check if the board already had an empty column_order_ids
            if (isEmpty(value)) {
              // Only allow empty array if it was empty before
              if (!isEmpty(board.column_order_ids)) {
                throw new Error(BOARDS_MESSAGES.COLUMN_ORDER_IDS_CANNOT_BE_EMPTY)
              }

              return true
            }

            // Check if all IDs in the column_order_ids array are valid ObjectIds
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(BOARDS_MESSAGES.INVALID_COLUMN_ID)
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
      },
      cover_photo: {
        optional: true,
        isString: { errorMessage: BOARDS_MESSAGES.COVER_PHOTO_MUST_BE_STRING }
      }
    },
    ['body']
  )
)

export const moveCardToDifferentColumnValidator = validate(
  checkSchema(
    {
      current_card_id: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.CURRENT_CARD_ID_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.CURRENT_CARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOARDS_MESSAGES.INVALID_CARD_ID)
            }

            const card = await databaseService.cards.findOne({
              _id: new ObjectId(value)
            })

            if (!card) {
              throw new Error(BOARDS_MESSAGES.CARD_NOT_FOUND)
            }

            return true
          }
        }
      },
      prev_column_id: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.PREV_COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.PREV_COLUMN_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOARDS_MESSAGES.INVALID_COLUMN_ID)
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value)
            })

            if (!column) {
              throw new Error(BOARDS_MESSAGES.COLUMN_NOT_FOUND)
            }

            return true
          }
        }
      },
      prev_card_order_ids: {
        isArray: { errorMessage: BOARDS_MESSAGES.PREV_CARD_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value) => {
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(BOARDS_MESSAGES.INVALID_CARD_ID)
            }

            return true
          }
        }
      },
      next_column_id: {
        notEmpty: { errorMessage: BOARDS_MESSAGES.NEXT_COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: BOARDS_MESSAGES.NEXT_COLUMN_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(BOARDS_MESSAGES.INVALID_COLUMN_ID)
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value)
            })

            if (!column) {
              throw new Error(BOARDS_MESSAGES.COLUMN_NOT_FOUND)
            }

            return true
          }
        }
      },
      next_card_order_ids: {
        isArray: { errorMessage: BOARDS_MESSAGES.NEXT_CARD_ORDER_IDS_MUST_BE_AN_ARRAY },
        custom: {
          options: async (value) => {
            if (value.some((id: string) => !ObjectId.isValid(id))) {
              throw new Error(BOARDS_MESSAGES.INVALID_CARD_ID)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
