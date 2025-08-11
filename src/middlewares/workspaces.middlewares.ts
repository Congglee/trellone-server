import { Request } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardRole, WorkspaceMemberAction, WorkspaceRole, WorkspaceType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { stringEnumToArray } from '~/utils/commons'
import { validate } from '~/utils/validation'

const workspaceTypes = stringEnumToArray(WorkspaceType)

const workspaceTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_IS_REQUIRED },
  isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 1, max: 50 },
    errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TITLE_LENGTH_MUST_BE_BETWEEN_1_AND_50
  }
}

const workspaceDescriptionSchema: ParamSchema = {
  optional: true,
  isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { max: 256 },
    errorMessage: WORKSPACES_MESSAGES.WORKSPACE_DESCRIPTION_LENGTH_MUST_BE_LESS_THAN_256
  }
}

const workspaceTypeSchema: ParamSchema = {
  isIn: {
    options: [workspaceTypes],
    errorMessage: WORKSPACES_MESSAGES.WORKSPACE_TYPE_MUST_BE_PUBLIC_OR_PRIVATE
  }
}

export const createWorkspaceValidator = validate(
  checkSchema(
    {
      title: workspaceTitleSchema,
      description: workspaceDescriptionSchema
    },
    ['body']
  )
)

export const workspaceIdValidator = validate(
  checkSchema(
    {
      workspace_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_WORKSPACE_ID
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const queryConditions = [
              { _id: new ObjectId(value) },
              {
                $or: [
                  { members: { $elemMatch: { user_id: new ObjectId(user_id) } } },
                  { guests: new ObjectId(user_id) }
                ]
              },
              { _destroy: false }
            ]

            // Execute MongoDB aggregation pipeline to fetch workspace with related data
            const [workspace] = await databaseService.workspaces
              .aggregate<Workspace>([
                // Stage 1: $match - Filter documents based on query conditions
                // This stage finds the workspace by ID, ensures it's not destroyed,
                // and verifies the current user is a member of the workspace
                {
                  $match: { $and: queryConditions }
                },
                // Stage 2: $lookup - Join with boards collection
                // This performs a left outer join to fetch all boards associated with this workspace
                // localField: '_id' (workspace ID) matches foreignField: 'workspace_id' in boards collection
                {
                  $lookup: {
                    from: envConfig.dbBoardsCollection,
                    localField: '_id',
                    foreignField: 'workspace_id',
                    as: 'boards'
                  }
                },
                // Stage 3: $lookup - Join with users collection for guest details
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'guests',
                    foreignField: '_id',
                    as: 'guests',
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
                // Stage 4: $lookup - Join with users collection for member details
                // This fetches user information for all workspace members
                // Uses a sub-pipeline to exclude sensitive user data (passwords, tokens)
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'members.user_id', // Array of user IDs from workspace members
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
                // Stage 4: $addFields - Transform and flatten member data structure
                // This stage restructures the members array to include user details directly
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
                    }
                  }
                },
                // Stage 5: $project - Clean up temporary fields
                // Remove the temporary 'memberUsers' field as it's no longer needed
                {
                  $project: { memberUsers: 0 }
                }
              ])
              .toArray()

            if (!workspace) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.WORKSPACE_NOT_FOUND
              })
            }

            ;(req as Request).workspace = workspace

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const updateWorkspaceValidator = validate(
  checkSchema(
    {
      title: { ...workspaceTitleSchema, optional: true, notEmpty: undefined },
      description: workspaceDescriptionSchema,
      type: { ...workspaceTypeSchema, optional: true },
      logo: {
        optional: true,
        isString: { errorMessage: WORKSPACES_MESSAGES.WORKSPACE_LOGO_MUST_BE_STRING }
      },
      member: {
        optional: true,
        isObject: { errorMessage: WORKSPACES_MESSAGES.MEMBER_MUST_BE_OBJECT },
        custom: {
          options: async (value, { req }) => {
            // Ensure all required fields are present in the member object
            const requiredFields = ['action', 'user_id']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${WORKSPACES_MESSAGES.MEMBER_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            const workspaceMemberActions = [
              WorkspaceMemberAction.EditRole,
              WorkspaceMemberAction.RemoveFromWorkspace,
              WorkspaceMemberAction.RemoveFromBoard,
              WorkspaceMemberAction.Leave
            ]

            // Case 01:Validate the action is either EditRole, RemoveFromWorkspace, RemoveFromBoard, Leave
            if (!workspaceMemberActions.includes(value.action)) {
              throw new Error(WORKSPACES_MESSAGES.INVALID_MEMBER_ACTION)
            }

            // Case 02: Validate the user_id is a valid ObjectId
            if (typeof value.user_id !== 'string' || !ObjectId.isValid(value.user_id)) {
              throw new Error(WORKSPACES_MESSAGES.INVALID_MEMBER_ID)
            }

            // Case 03: Validate the user_id is a member of the workspace
            const workspace = (req as Request).workspace
            const isMemberExists = workspace?.members?.some((member) =>
              member.user_id.equals(new ObjectId(value.user_id))
            )

            if (!isMemberExists) {
              throw new Error(WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE)
            }

            // Case 04: Validate the role if the action is EditRole
            if (value.action === WorkspaceMemberAction.EditRole) {
              if (!value.role) {
                throw new Error(WORKSPACES_MESSAGES.WORKSPACE_ROLE_IS_REQUIRED)
              }

              if (![WorkspaceRole.Admin, WorkspaceRole.Normal].includes(value.role)) {
                throw new Error(WORKSPACES_MESSAGES.INVALID_WORKSPACE_ROLE)
              }
            }

            // Case 05: Ensure at least one admin remains in workspace applies to EditRole, RemoveFromWorkspace, and Leave actions
            if (
              [
                WorkspaceMemberAction.EditRole,
                WorkspaceMemberAction.RemoveFromWorkspace,
                WorkspaceMemberAction.Leave
              ].includes(value.action)
            ) {
              // Get current workspace admins
              const currentAdmins = workspace?.members?.filter((member) => member.role === WorkspaceRole.Admin) || []

              // Check if the user being modified is currently an admin
              const targetMember = workspace?.members?.find((member) =>
                member.user_id.equals(new ObjectId(value.user_id))
              )
              const isTargetCurrentlyAdmin = targetMember?.role === WorkspaceRole.Admin

              // If there's only one admin and we're trying to modify that admin
              if (currentAdmins.length === 1 && isTargetCurrentlyAdmin) {
                // For EditRole: check if we're demoting the last admin to Normal
                if (value.action === WorkspaceMemberAction.EditRole && value.role === WorkspaceRole.Normal) {
                  throw new Error(WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_WORKSPACE_ADMIN)
                }

                // For RemoveFromWorkspace or Leave: cannot remove the last admin
                if (
                  value.action === WorkspaceMemberAction.RemoveFromWorkspace ||
                  value.action === WorkspaceMemberAction.Leave
                ) {
                  throw new Error(WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_WORKSPACE_ADMIN)
                }
              }
            }

            // Case 06: Handle RemoveFromBoard action
            if (value.action === WorkspaceMemberAction.RemoveFromBoard) {
              // Require board_id for RemoveFromBoard action
              if (!value.board_id) {
                throw new Error(WORKSPACES_MESSAGES.BOARD_ID_IS_REQUIRED)
              }

              // Validate board_id format
              if (typeof value.board_id !== 'string' || !ObjectId.isValid(value.board_id)) {
                throw new Error(WORKSPACES_MESSAGES.BOARD_ID_IS_REQUIRED)
              }

              // Find the board and verify it belongs to this workspace
              const board = await databaseService.boards.findOne({
                _id: new ObjectId(value.board_id),
                workspace_id: workspace?._id,
                _destroy: false
              })

              if (!board) {
                throw new Error(WORKSPACES_MESSAGES.BOARD_NOT_FOUND)
              }

              // Check if the user is a member of this board
              const isBoardMember = board.members?.some((member) => member.user_id.equals(new ObjectId(value.user_id)))

              if (!isBoardMember) {
                throw new Error(WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_BOARD)
              }

              // Ensure at least one admin remains on the board after removal
              const boardAdmins = board.members?.filter((member) => member.role === BoardRole.Admin) || []
              const targetBoardMember = board.members?.find((member) =>
                member.user_id.equals(new ObjectId(value.user_id))
              )
              const isTargetBoardAdmin = targetBoardMember?.role === BoardRole.Admin

              // If there's only one board admin and we're trying to remove that admin
              if (boardAdmins.length === 1 && isTargetBoardAdmin) {
                throw new Error(WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_BOARD_ADMIN)
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
