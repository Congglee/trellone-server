import { validate } from '~/utils/validation'
import { checkSchema, ParamSchema } from 'express-validator'
import { BOARDS_MESSAGES } from '~/constants/messages'
import { stringEnumToArray } from '~/utils/commons'
import { BoardRole, BoardType } from '~/constants/enums'
import { ObjectId } from 'mongodb'
import { ErrorWithStatus } from '~/models/Errors'
import HTTP_STATUS from '~/constants/httpStatus'
import databaseService from '~/services/database.services'
import { NextFunction, Request, Response } from 'express'
import Board from '~/models/schemas/Board.schema'
import { envConfig } from '~/config/environment'
import { isEmpty } from 'lodash'
import { TokenPayload } from '~/models/requests/User.requests'
import { wrapRequestHandler } from '~/utils/handlers'
import { assertBoardIsOpen } from '~/utils/guards'

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

            const [board] = await databaseService.boards
              .aggregate<Board>([
                { $match: { _id: new ObjectId(value) } },
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
                    from: envConfig.dbWorkspacesCollection,
                    localField: 'workspace_id',
                    foreignField: '_id',
                    as: 'workspaceData',
                    pipeline: [
                      {
                        $project: {
                          title: 1,
                          logo: 1,
                          members: 1,
                          guests: 1
                        }
                      }
                    ]
                  }
                },
                {
                  $match: {
                    $or: [
                      {
                        members: {
                          $elemMatch: {
                            user_id: new ObjectId(user_id)
                          }
                        }
                      },
                      {
                        'workspaceData.members': {
                          $elemMatch: {
                            user_id: new ObjectId(user_id)
                          }
                        }
                      }
                    ]
                  }
                },
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'members.user_id',
                    foreignField: '_id',
                    as: 'memberUsers',
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
                    members: {
                      $map: {
                        input: '$members',
                        as: 'member',
                        in: {
                          $let: {
                            vars: {
                              user: {
                                $arrayElemAt: [
                                  {
                                    $filter: {
                                      input: '$memberUsers',
                                      as: 'user',
                                      cond: {
                                        $eq: ['$$user._id', '$$member.user_id']
                                      }
                                    }
                                  },
                                  0
                                ]
                              }
                            },
                            in: {
                              $mergeObjects: ['$$member', '$$user']
                            }
                          }
                        }
                      }
                    },
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
                    },
                    workspace: {
                      $arrayElemAt: ['$workspaceData', 0]
                    }
                  }
                },
                {
                  $project: {
                    cards: 0,
                    memberUsers: 0,
                    workspaceData: 0
                  }
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
      },
      _destroy: {
        optional: true,
        custom: {
          options: (value) => {
            if (typeof value !== 'boolean' && typeof value !== 'undefined') {
              throw new Error(BOARDS_MESSAGES.BOARD_ARCHIVE_STATUS_MUST_BE_BOOLEAN)
            }

            return true
          }
        },
        toBoolean: true
      }
    },
    ['body']
  )
)

export const leaveBoardValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const board = (req as Request).board as Board

  // Ensure at least one admin remains on the board after removal
  const boardAdmins = board.members?.filter((member) => member.role === BoardRole.Admin) || []
  const targetBoardMember = board.members?.find((member) => member.user_id.equals(new ObjectId(user_id)))

  const isTargetBoardAdmin = targetBoardMember?.role === BoardRole.Admin

  if (boardAdmins.length === 1 && isTargetBoardAdmin) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.BAD_REQUEST,
      message: BOARDS_MESSAGES.CANNOT_REMOVE_LAST_BOARD_ADMIN
    })
  }

  next()
})

export const requireBoardMembership = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const board = (req as Request).board as Board

  const isBoardMember = board.members?.some((member) => member.user_id.equals(new ObjectId(user_id))) || false

  if (!isBoardMember) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: BOARDS_MESSAGES.USER_NOT_MEMBER_OF_BOARD
    })
  }

  next()
})

export const boardWorkspaceIdValidator = validate(
  checkSchema(
    {
      workspace_id: {
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: BOARDS_MESSAGES.INVALID_WORKSPACE_ID
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

export const rejectIfBoardClosed = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const board = (req as Request).board as Board

  if (!board || !board._destroy) {
    return next()
  }

  // Get body from request, if not exists then assign empty object
  const body = (req.body || {}) as Record<string, unknown>

  // Check if the request is only for reopening the board
  // hasOnlyReopenFlag will be true if:
  // 1. Body contains '_destroy' property
  // 2. Value of '_destroy' is false (meaning want to reopen the board)
  // 3. Body contains only '_destroy' property (no other properties)
  const hasOnlyReopenFlag =
    Object.prototype.hasOwnProperty.call(body, '_destroy') &&
    body._destroy === false &&
    Object.keys(body).every((key) => key === '_destroy')

  // If the request is not for reopening the board (hasOnlyReopenFlag = false)
  // then check if the board is closed, if closed then throw error
  // This means: only allow reopening operation when board is closed,
  // other operations will be rejected
  if (!hasOnlyReopenFlag) {
    assertBoardIsOpen(board)
  }

  return next()
})
