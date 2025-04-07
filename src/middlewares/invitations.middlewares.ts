import { Request } from 'express'
import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

export const createNewBoardInvitationValidator = validate(
  checkSchema(
    {
      invitee_email: {
        isEmail: { errorMessage: INVITATIONS_MESSAGES.INVITEE_EMAIL_IS_INVALID },
        trim: true,
        custom: {
          options: async (value) => {
            const invitee = await databaseService.users.findOne({ email: value })

            if (invitee === null) {
              throw new Error(INVITATIONS_MESSAGES.INVITEE_NOT_FOUND_OR_NOT_REGISTERED_AN_ACCOUNT)
            }

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
              _id: new ObjectId(value),
              _destroy: false
            })

            if (!board) {
              throw new Error(INVITATIONS_MESSAGES.BOARD_NOT_FOUND)
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const checkUserBoardAccess = await databaseService.boards.countDocuments({
              _id: new ObjectId(value),
              $or: [
                {
                  owners: { $in: [new ObjectId(user_id)] }
                },
                {
                  members: { $in: [new ObjectId(user_id)] }
                }
              ],
              _destroy: false
            })

            if (!checkUserBoardAccess) {
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
