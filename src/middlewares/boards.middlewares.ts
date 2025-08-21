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
              { members: { $elemMatch: { user_id: new ObjectId(user_id) } } }
            ]

            // Execute MongoDB aggregation pipeline to fetch board with related data
            const [board] = await databaseService.boards
              .aggregate<Board>([
                // Stage 1: $match - Filter documents based on query conditions
                // This stage finds the board by ID, ensures it's not destroyed,
                // and verifies the current user is a member of the board
                {
                  $match: { $and: queryConditions }
                },
                // Stage 2: $lookup - Join with columns collection
                // This performs a left outer join to fetch all columns associated with this board
                {
                  $lookup: {
                    from: envConfig.dbColumnsCollection,
                    localField: '_id',
                    foreignField: 'board_id',
                    as: 'columns'
                  }
                },
                // Stage 3: $lookup - Join with cards collection
                // This fetches all cards associated with this board for column organization
                {
                  $lookup: {
                    from: envConfig.dbCardsCollection,
                    localField: '_id',
                    foreignField: 'board_id',
                    as: 'cards'
                  }
                },
                // Stage 4: $lookup - Join with workspaces collection
                // This fetches workspace information and all boards within that workspace
                {
                  $lookup: {
                    from: envConfig.dbWorkspacesCollection,
                    localField: 'workspace_id', // Board's workspace_id field
                    foreignField: '_id', // Workspace document _id field
                    as: 'workspaceData', // Store results in temporary field
                    pipeline: [
                      {
                        // Sub-pipeline: $lookup - Join with boards collection for workspace boards
                        // This fetches all boards within the workspace for navigation purposes
                        $lookup: {
                          from: envConfig.dbBoardsCollection,
                          localField: '_id', // Workspace _id
                          foreignField: 'workspace_id', // Board's workspace_id reference
                          as: 'boards', // Store workspace boards in boards array
                          pipeline: [
                            {
                              // Nested sub-pipeline: $project - Only fetch required board fields
                              // This optimizes performance by excluding unnecessary board data
                              $project: { title: 1, cover_photo: 1 }
                            },
                            {
                              // Filter out destroyed boards for clean workspace navigation
                              $match: { _destroy: { $ne: true } }
                            }
                          ]
                        }
                      },
                      {
                        // Sub-pipeline: $project - Only fetch required workspace fields
                        // This maintains data privacy by excluding sensitive workspace information
                        $project: {
                          title: 1,
                          logo: 1,
                          boards: 1
                        }
                      }
                    ]
                  }
                },
                // Stage 5: $lookup - Join with users collection for member details
                // This fetches user information for all board members
                // Uses a sub-pipeline to exclude sensitive user data (passwords, tokens)
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'members.user_id', // Array of user IDs from board members
                    foreignField: '_id', // User document _id field
                    as: 'memberUsers', // Store results in temporary field
                    pipeline: [
                      {
                        // Sub-pipeline: $project - Exclude sensitive user fields
                        // This ensures passwords and security tokens are not returned
                        $project: {
                          password: 0,
                          email_verify_token: 0,
                          forgot_password_token: 0
                        }
                      }
                    ]
                  }
                },
                // Stage 6: $addFields - Transform member data structure, organize columns, and add workspace
                // This stage restructures the members array to include user details directly,
                // organizes cards within their respective columns, and adds workspace information
                {
                  $addFields: {
                    members: {
                      // $map - Transform each element in the members array
                      $map: {
                        input: '$members', // Process each member in the array
                        as: 'member', // Variable name for current member
                        in: {
                          // $let - Define variables for use in expression
                          $let: {
                            vars: {
                              // Find the corresponding user document for this member
                              user: {
                                // $arrayElemAt - Get the first element from filtered array
                                $arrayElemAt: [
                                  {
                                    // $filter - Find user document matching member's user_id
                                    $filter: {
                                      input: '$memberUsers', // Search in fetched user documents
                                      as: 'user', // Variable name for current user
                                      cond: {
                                        // $eq - Match user._id with member.user_id
                                        $eq: ['$$user._id', '$$member.user_id']
                                      }
                                    }
                                  },
                                  0 // Get first (and only) matching element
                                ]
                              }
                            },
                            in: {
                              // $mergeObjects - Combine member and user data into single object
                              // Keep user_id field from member object for downstream processing
                              $mergeObjects: [
                                '$$member', // Keep all member fields including user_id
                                '$$user' // Merge all user fields into member object
                              ]
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
                      // $arrayElemAt - Extract the first (and only) workspace from workspaceData array
                      // Since we're joining on workspace_id, there should be exactly one match
                      $arrayElemAt: ['$workspaceData', 0]
                    }
                  }
                },
                // Stage 7: $project - Clean up temporary fields
                // Remove temporary fields that are no longer needed
                {
                  $project: {
                    cards: 0, // Remove cards array as they're now nested in columns
                    memberUsers: 0, // Remove temporary memberUsers field
                    workspaceData: 0 // Remove temporary workspaceData field as it's now in workspace
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
      }
    },
    ['body']
  )
)
