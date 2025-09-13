import { NextFunction, Request, Response } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardRole, WorkspaceRole, WorkspaceType } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { WORKSPACES_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import { WorkspaceGuestParams, WorkspaceMemberParams } from '~/models/requests/Workspace.requests'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { stringEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
import { validate } from '~/utils/validation'

const workspaceTypes = stringEnumToArray(WorkspaceType)
const roleTypes = stringEnumToArray(WorkspaceRole)

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
                $or: [{ members: { $elemMatch: { user_id: new ObjectId(user_id) } } }]
              }
            ]

            const [workspace] = await databaseService.workspaces
              .aggregate<Workspace>([
                { $match: { $and: queryConditions } },
                {
                  $lookup: {
                    from: envConfig.dbBoardsCollection,
                    localField: '_id',
                    foreignField: 'workspace_id',
                    as: 'boards',
                    pipeline: [{ $match: { _destroy: false } }]
                  }
                },
                {
                  $lookup: {
                    from: envConfig.dbUsersCollection,
                    localField: 'guests',
                    foreignField: '_id',
                    as: 'guests',
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
                    }
                  }
                },
                { $project: { memberUsers: 0 } }
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
      }
    },
    ['body']
  )
)

export const workspaceMemberIdValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_USER_ID
              })
            }

            const user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_FOUND
              })
            }

            const workspace = (req as Request).workspace
            const isMemberExists = workspace?.members?.some((member) => member.user_id.equals(new ObjectId(value)))

            if (!isMemberExists) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE
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

export const editWorkspaceMemberRoleValidator = validate(
  checkSchema(
    {
      role: {
        isIn: {
          options: [roleTypes],
          errorMessage: WORKSPACES_MESSAGES.WORKSPACE_ROLE_MUST_BE_ADMIN_OR_NORMAL
        },
        custom: {
          options: async (value, { req }) => {
            // Ensure at least one admin remains in workspace
            const workspace = (req as Request).workspace
            const { user_id } = req.params as WorkspaceMemberParams

            // Get current workspace admins
            const currentAdmins = workspace?.members?.filter((member) => member.role === WorkspaceRole.Admin) || []

            // Check if the user being modified is currently an admin
            const targetMember = workspace?.members?.find((member) => member.user_id.equals(new ObjectId(user_id)))
            const isTargetCurrentlyAdmin = targetMember?.role === WorkspaceRole.Admin

            // If there's only one admin and we're trying to modify that admin
            if (currentAdmins.length === 1 && isTargetCurrentlyAdmin) {
              if (value === WorkspaceRole.Normal) {
                throw new ErrorWithStatus({
                  status: HTTP_STATUS.BAD_REQUEST,
                  message: WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_WORKSPACE_ADMIN
                })
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

export const leaveWorkspaceValidator = wrapRequestHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const workspace = (req as Request).workspace

  const isCurrentUserMember = workspace?.members?.some((member) => member.user_id.equals(new ObjectId(user_id)))

  if (!isCurrentUserMember) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.FORBIDDEN,
      message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_WORKSPACE
    })
  }

  // Ensure at least one admin remains in workspace

  // Get current workspace admins
  const currentAdmins = workspace?.members?.filter((member) => member.role === WorkspaceRole.Admin) || []

  // Check if the user being modified is currently an admin
  const targetMember = workspace?.members?.find((member) => member.user_id.equals(new ObjectId(user_id)))
  const isTargetCurrentlyAdmin = targetMember?.role === WorkspaceRole.Admin

  // If there's only one admin and we're trying to modify that admin
  if (currentAdmins.length === 1 && isTargetCurrentlyAdmin) {
    throw new ErrorWithStatus({
      status: HTTP_STATUS.BAD_REQUEST,
      message: WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_WORKSPACE_ADMIN
    })
  }

  next()
})

export const removeWorkspaceMemberValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value, { req }) => {
            // Ensure at least one admin remains in workspace
            const workspace = (req as Request).workspace

            // Get current workspace admins
            const currentAdmins = workspace?.members?.filter((member) => member.role === WorkspaceRole.Admin) || []

            // Check if the user being modified is currently an admin
            const targetMember = workspace?.members?.find((member) => member.user_id.equals(new ObjectId(value)))
            const isTargetCurrentlyAdmin = targetMember?.role === WorkspaceRole.Admin

            // If there's only one admin and we're trying to modify that admin
            if (currentAdmins.length === 1 && isTargetCurrentlyAdmin) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_WORKSPACE_ADMIN
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

export const removeWorkspaceMemberFromBoardValidator = validate(
  checkSchema(
    {
      board_id: {
        notEmpty: { errorMessage: WORKSPACES_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: WORKSPACES_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_BOARD_ID
              })
            }

            const workspace = (req as Request).workspace
            const { user_id } = req.params as WorkspaceMemberParams

            // Find the board and verify it belongs to this workspace
            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value),
              workspace_id: workspace?._id,
              _destroy: false
            })

            if (!board) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.BOARD_NOT_FOUND
              })
            }

            // Check if the user is a member of this board
            const isBoardMemberExists = board.members?.some((member) => member.user_id.equals(new ObjectId(user_id)))

            if (!isBoardMemberExists) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_BOARD
              })
            }

            // Ensure at least one admin remains on the board after removal
            const boardAdmins = board.members?.filter((member) => member.role === BoardRole.Admin) || []
            const targetBoardMember = board.members?.find((member) => member.user_id.equals(new ObjectId(user_id)))

            const isTargetBoardAdmin = targetBoardMember?.role === BoardRole.Admin

            if (boardAdmins.length === 1 && isTargetBoardAdmin) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_BOARD_ADMIN
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const workspaceGuestIdValidator = validate(
  checkSchema(
    {
      user_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_USER_ID
              })
            }

            const user = await databaseService.users.findOne({
              _id: new ObjectId(value)
            })

            if (!user) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_FOUND
              })
            }

            const workspace = (req as Request).workspace
            const isGuestExists = workspace?.guests?.some((guest: any) => guest._id.equals(new ObjectId(value)))

            if (!isGuestExists) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_GUEST_OF_WORKSPACE
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

export const removeGuestFromBoardValidator = validate(
  checkSchema(
    {
      board_id: {
        notEmpty: { errorMessage: WORKSPACES_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: WORKSPACES_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.INVALID_BOARD_ID
              })
            }

            const workspace = (req as Request).workspace
            const { user_id } = req.params as WorkspaceGuestParams

            // Find the board and verify it belongs to this workspace
            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value),
              workspace_id: workspace?._id,
              _destroy: false
            })

            if (!board) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.BOARD_NOT_FOUND
              })
            }

            // Check if the user is a member of this board
            const isBoardMemberExists = board.members?.some((member) => member.user_id.equals(new ObjectId(user_id)))

            if (!isBoardMemberExists) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: WORKSPACES_MESSAGES.USER_NOT_MEMBER_OF_BOARD
              })
            }

            // Ensure at least one admin remains on the board after removal
            const boardAdmins = board.members?.filter((member) => member.role === BoardRole.Admin) || []
            const targetBoardMember = board.members?.find((member) => member.user_id.equals(new ObjectId(user_id)))

            const isTargetBoardAdmin = targetBoardMember?.role === BoardRole.Admin

            if (boardAdmins.length === 1 && isTargetBoardAdmin) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: WORKSPACES_MESSAGES.CANNOT_REMOVE_LAST_BOARD_ADMIN
              })
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const joinWorkspaceBoardValidator = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { user_id } = req.decoded_authorization as TokenPayload
    const board = (req as Request).board

    const isAlreadyBoardMember = board?.members?.some((member) => member.user_id.equals(new ObjectId(user_id)))

    if (isAlreadyBoardMember) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: WORKSPACES_MESSAGES.USER_ALREADY_JOINED_BOARD
      })
    }

    next()
  }
)
