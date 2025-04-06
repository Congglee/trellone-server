import { checkSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { INVITATIONS_MESSAGES } from '~/constants/messages'
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
              throw new Error(INVITATIONS_MESSAGES.INVITEE_NOT_FOUND)
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
          options: async (value) => {
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

            return true
          }
        }
      }
    },
    ['body']
  )
)
