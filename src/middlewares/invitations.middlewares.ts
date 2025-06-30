import { NextFunction, Request, Response } from 'express'
import { checkSchema } from 'express-validator'
import { JsonWebTokenError } from 'jsonwebtoken'
import { capitalize } from 'lodash'
import { ObjectId } from 'mongodb'
import { envConfig } from '~/config/environment'
import { BoardInvitationStatus } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
import { ErrorWithStatus } from '~/models/Errors'
import { InviteTokenPayload } from '~/models/requests/Invitation.requests'
import { TokenPayload } from '~/models/requests/User.requests'
import Board from '~/models/schemas/Board.schema'
import Invitation from '~/models/schemas/Invitation.schema'
import User from '~/models/schemas/User.schema'
import databaseService from '~/services/database.services'
import { stringEnumToArray } from '~/utils/commons'
import { wrapRequestHandler } from '~/utils/handlers'
import { verifyToken } from '~/utils/jwt'
import { validate } from '~/utils/validation'

const boardInvitationStatus = stringEnumToArray(BoardInvitationStatus)

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

            const isUserBoardOwnerOrMember = await databaseService.boards.countDocuments({
              _id: new ObjectId(value),
              $or: [
                {
                  owners: { $in: [new ObjectId(user_id)] }
                },
                {
                  members: { $in: [new ObjectId(user_id)] }
                }
              ]
            })

            if (!isUserBoardOwnerOrMember) {
              throw new Error(INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_BOARD)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const checkInviteeMembershipValidator = wrapRequestHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const invitee = req.invitee as User
    const board = req.board as Board

    // Check if the invitee is already an owner or member of the board
    const isAlreadyMember = [...board.owners, ...board.members].some((id) => id.toString() === invitee._id?.toString())

    if (isAlreadyMember) {
      throw new ErrorWithStatus({
        status: HTTP_STATUS.BAD_REQUEST,
        message: INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_BOARD
      })
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

export const boardInvitationIdValidator = validate(
  checkSchema(
    {
      invitation_id: {
        notEmpty: { errorMessage: INVITATIONS_MESSAGES.BOARD_INVITATION_ID_IS_REQUIRED },
        isString: { errorMessage: INVITATIONS_MESSAGES.BOARD_INVITATION_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: INVITATIONS_MESSAGES.INVALID_BOARD_INVITATION_ID
              })
            }

            const invitation = await databaseService.invitations.findOne({
              _id: new ObjectId(value)
            })

            if (!invitation) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: INVITATIONS_MESSAGES.BOARD_INVITATION_NOT_FOUND
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const isUserBoardInvitationHasAccess = await databaseService.invitations.countDocuments({
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

            if (!isUserBoardInvitationHasAccess) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.FORBIDDEN,
                message: INVITATIONS_MESSAGES.USER_DOES_NOT_HAVE_ACCESS_TO_BOARD_INVITATION
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

export const updateBoardInvitationValidator = validate(
  checkSchema(
    {
      status: {
        isIn: {
          options: [boardInvitationStatus],
          errorMessage: INVITATIONS_MESSAGES.INVALID_BOARD_INVITATION_STATUS
        },
        custom: {
          options: async (value, { req }) => {
            const invitation = (req as Request).invitation as Invitation
            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const board_id = invitation.board_invitation.board_id

            const board = (await databaseService.boards.findOne({
              _id: new ObjectId(board_id)
            })) as Board

            const boardOwnerAndMemberIds = [...board.owners, ...board.members].toString()

            if (value === BoardInvitationStatus.Accepted && boardOwnerAndMemberIds.includes(user_id)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: INVITATIONS_MESSAGES.USER_IS_ALREADY_MEMBER_OF_BOARD
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
