import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardInvitationStatus, BoardRole, WorkspaceInvitationStatus, WorkspaceRole } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { InviteTokenPayload } from '~/models/requests/Invitation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import Workspace from '~/models/schemas/Workspace.schema'
import databaseService from '~/services/database.services'
import { stringEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const workspaceInvitationStatus = stringEnumToArray(WorkspaceInvitationStatus)
const workspaceRoles = stringEnumToArray(WorkspaceRole)

const boardInvitationStatus = stringEnumToArray(BoardInvitationStatus)
const boardRoles = stringEnumToArray(BoardRole)

export const createNewWorkspaceInvitationValidator = validate(
  checkSchema({
    invitee_email: {
      isEmail: { errorMessage: INVITATIONS_MESSAGES.INVITEE_EMAIL_IS_INVALID },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          const invitee = await databaseService.users.findOne({ email: value })

          if (invitee === null) {
            throw new Error(INVITATIONS_MESSAGES.INVITEE_NOT_FOUND_OR_NOT_REGISTERED_AN_ACCOUNT)
          }

          ;(req as Request).invitee = invitee

          return true
        }
      }
    },
    workspace_id: {
      notEmpty: { errorMessage: INVITATIONS_MESSAGES.WORKSPACE_ID_IS_REQUIRED },
      isString: { errorMessage: INVITATIONS_MESSAGES.WORKSPACE_ID_MUST_BE_STRING },
      trim: true,
      custom: {
        options: async (value, { req }) => {
          if (!ObjectId.isValid(value)) {
            throw new Error(INVITATIONS_MESSAGES.INVALID_WORKSPACE_ID)
          }

          const workspace = await databaseService.workspaces.findOne({
            _id: new ObjectId(value)
          })

          if (!workspace) {
            throw new Error(INVITATIONS_MESSAGES.WORKSPACE_NOT_FOUND)
          }

          ;(req as Request).workspace = workspace

          const { user_id } = (req as Request).decoded_authorization as TokenPayload

          const isUserWorkspaceMember = await databaseService.workspaces.countDocuments({
            _id: new ObjectId(value),
            members: { $elemMatch: { user_id: new ObjectId(user_id) } }
          })

          if (!isUserWorkspaceMember) {
            throw new Error(INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_WORKSPACE)
          }

          return true
        }
      }
    },
    role: {
      isIn: {
        options: [workspaceRoles],
        errorMessage: INVITATIONS_MESSAGES.INVALID_WORKSPACE_ROLE
      }
    }
  })
)

export const createNewBoardInvitationValidator = validate(
  checkSchema(
    {
      invitee_email: {
        isEmail: { errorMessage: INVITATIONS_MESSAGES.INVITEE_EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            const invitee = await databaseService.users.findOne({ email: value })

            if (invitee === null) {
              throw new Error(INVITATIONS_MESSAGES.INVITEE_NOT_FOUND_OR_NOT_REGISTERED_AN_ACCOUNT)
            }

            ;(req as Request).invitee = invitee

            return true
          }
        }
      },
      board_id: {
        notEmpty: { errorMessage: INVITATIONS_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: INVITATIONS_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(INVITATIONS_MESSAGES.INVALID_BOARD_ID)
            }

            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value)
            })

            if (!board) {
              throw new Error(INVITATIONS_MESSAGES.BOARD_NOT_FOUND)
            }

            ;(req as Request).board = board

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const isUserBoardMember = await databaseService.boards.countDocuments({
              _id: new ObjectId(value),
              members: { $elemMatch: { user_id: new ObjectId(user_id) } }
            })

            if (!isUserBoardMember) {
              throw new Error(INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_BOARD)
            }

            return true
          }
        }
      },
      workspace_id: {
        notEmpty: { errorMessage: INVITATIONS_MESSAGES.WORKSPACE_ID_IS_REQUIRED },
        isString: { errorMessage: INVITATIONS_MESSAGES.WORKSPACE_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(INVITATIONS_MESSAGES.INVALID_WORKSPACE_ID)
            }

            const workspace = await databaseService.workspaces.findOne({
              _id: new ObjectId(value)
            })

            if (!workspace) {
              throw new Error(INVITATIONS_MESSAGES.WORKSPACE_NOT_FOUND)
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            // Check whether the current user is a "guest" or a "member" in the workspace
            const isUserWorkspaceMember = await databaseService.workspaces.countDocuments({
              _id: new ObjectId(value),
              $or: [
                { guests: { $elemMatch: { user_id: new ObjectId(user_id) } } },
                { members: { $elemMatch: { user_id: new ObjectId(user_id) } } }
              ]
            })

            if (!isUserWorkspaceMember) {
              throw new Error(INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_WORKSPACE)
            }

            return true
          }
        }
      },
      role: {
        isIn: {
          options: [boardRoles],
          errorMessage: INVITATIONS_MESSAGES.INVALID_BOARD_ROLE
        }
      }
    },
    ['body']
  )
)

export const verifyInviteeMembershipValidator = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invitee = req.invitee as User
    const board = req.board as Board
    const workspace = req.workspace as Workspace

    let isAlreadyMember = false
    let message = ''

    // Check if the invitee is already an owner or member of the board
    if (board) {
      isAlreadyMember = board.members?.some((member) => member.user_id.toString() === invitee._id?.toString())
      message = INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_BOARD
    }

    if (workspace) {
      isAlreadyMember = workspace.members?.some((member) => member.user_id.toString() === invitee._id?.toString())
      message = INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_WORKSPACE
    }

    if (isAlreadyMember) {
      throw new ErrorWithStatus({ status: HTTP_STATUS.BAD_REQUEST, message })
    }

    next()
  }
)

export const verifyInviteTokenValidator = validate(
  checkSchema(
    {
      invite_token: {
        trim: true,
        custom: {
          options: async (value: string, { req }) => {
            if (!value) {
              throw new ErrorWithStatus({
                message: INVITATIONS_MESSAGES.INVITE_TOKEN_IS_REQUIRED,
                status: HTTP_STATUS.BAD_REQUEST
              })
            }

            try {
              const decoded_invite_token = await verifyToken<InviteTokenPayload>({
                token: value,
                secretOrPublicKey: envConfig.jwtSecretInviteToken as string
              })
              const { inviter_id, invitation_id } = decoded_invite_token

              const inviter = await databaseService.users.findOne({
                _id: new ObjectId(inviter_id)
              })

              if (inviter === null) {
                throw new ErrorWithStatus({
                  message: INVITATIONS_MESSAGES.INVITER_NOT_FOUND,
                  status: HTTP_STATUS.NOT_FOUND
                })
              }

              const invitation = await databaseService.invitations.findOne({
                _id: new ObjectId(invitation_id),
                invite_token: value
              })

              if (!invitation) {
                throw new ErrorWithStatus({
                  message: INVITATIONS_MESSAGES.INVALID_INVITE_TOKEN,
                  status: HTTP_STATUS.BAD_REQUEST
                })
              }

              ;(req as Request).decoded_invite_token = decoded_invite_token
            } catch (error) {
              if (error instanceof JsonWebTokenError) {
                throw new ErrorWithStatus({
                  message: capitalize(error.message),
                  status: HTTP_STATUS.UNAUTHORIZED
                })
              }

              throw error
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const invitationIdValidator = validate(
  checkSchema(
    {
      invitation_id: {
        notEmpty: { errorMessage: INVITATIONS_MESSAGES.INVITATION_ID_IS_REQUIRED },
        isString: { errorMessage: INVITATIONS_MESSAGES.INVITATION_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: INVITATIONS_MESSAGES.INVALID_INVITATION_ID
              })
            }

            const invitation = await databaseService.invitations.findOne({
              _id: new ObjectId(value)
            })

            if (!invitation) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: INVITATIONS_MESSAGES.INVITATION_NOT_FOUND
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const isUserInvitationHasAccess = await databaseService.invitations.countDocuments({
              _id: invitation._id,
              $or: [
                {
                  inviter_id: new ObjectId(user_id)
                },
                {
                  invitee_id: new ObjectId(user_id)
                }
              ]
            })

            if (!isUserInvitationHasAccess) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.FORBIDDEN,
                message: INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_INVITATION
              })
            }

            ;(req as Request).invitation = invitation

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const workspaceInvitationUpdateGuard = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invitation = req.invitation as Invitation
    const { status } = req.body

    const invitee_id = invitation.invitee_id.toString()
    const workspace_id = invitation.workspace_invitation?.workspace_id

    const { user_id } = req.decoded_authorization as TokenPayload

    // Ensure only the invited user can accept the invitation
    if (user_id !== invitee_id) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: INVITATIONS_MESSAGES.ONLY_INVITED_USER_CAN_ACCEPT_INVITATION
      })
    }

    const workspace = (await databaseService.workspaces.findOne({
      _id: new ObjectId(workspace_id)
    })) as Workspace

    const workspaceMemberIds = workspace.members?.map((member) => member.user_id.toString())

    if (status === WorkspaceInvitationStatus.Accepted && workspaceMemberIds?.includes(invitee_id)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_WORKSPACE
      })
    }

    next()
  }
)

export const updateWorkspaceInvitationValidator = validate(
  checkSchema(
    {
      status: {
        isIn: {
          options: [workspaceInvitationStatus],
          errorMessage: INVITATIONS_MESSAGES.INVALID_WORKSPACE_INVITATION_STATUS
        }
      }
    },
    ['body']
  )
)

export const updateBoardInvitationValidator = validate(
  checkSchema(
    {
      status: {
        isIn: {
          options: [boardInvitationStatus],
          errorMessage: INVITATIONS_MESSAGES.INVALID_BOARD_INVITATION_STATUS
        }
      }
    },
    ['body']
  )
)

export const boardInvitationUpdateGuard = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invitation = req.invitation as Invitation
    const { status } = req.body

    const invitee_id = invitation.invitee_id.toString()
    const board_id = invitation.board_invitation?.board_id

    const { user_id } = req.decoded_authorization as TokenPayload

    // Ensure only the invited user can accept the invitation
    if (user_id !== invitee_id) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.FORBIDDEN,
        message: INVITATIONS_MESSAGES.ONLY_INVITED_USER_CAN_ACCEPT_INVITATION
      })
    }

    const board = (await databaseService.boards.findOne({
      _id: new ObjectId(board_id)
    })) as Board

    const boardMemberIds = board.members?.map((member) => member.user_id.toString())

    if (status === BoardInvitationStatus.Accepted && boardMemberIds?.includes(invitee_id)) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_BOARD
      })
    }

    next()
  }
)
