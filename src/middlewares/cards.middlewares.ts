import { Request } from 'express'
import { checkSchema, ParamSchema } from 'express-validator'
import { ObjectId } from 'mongodb'
import { CardMemberAction } from '~/constants/enums'
import HTTP_STATUS from '~/constants/httpStatus'
import { CARDS_MESSAGES } from '~/constants/messages'
import { ISO8601_REGEX } from '~/constants/regex'
import { ErrorWithStatus } from '~/models/Errors'
import { TokenPayload } from '~/models/requests/User.requests'
import databaseService from '~/services/database.services'
import { validate } from '~/utils/validation'

const cardTitleSchema: ParamSchema = {
  notEmpty: { errorMessage: CARDS_MESSAGES.CARD_TITLE_IS_REQUIRED },
  isString: { errorMessage: CARDS_MESSAGES.CARD_TITLE_MUST_BE_STRING },
  trim: true,
  isLength: {
    options: { min: 3, max: 50 },
    errorMessage: CARDS_MESSAGES.CARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50
  }
}

export const createCardValidator = validate(
  checkSchema(
    {
      title: cardTitleSchema,
      board_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.BOARD_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.BOARD_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_BOARD_ID)
            }

            const board = await databaseService.boards.findOne({
              _id: new ObjectId(value)
            })

            if (!board) {
              throw new Error(CARDS_MESSAGES.BOARD_NOT_FOUND)
            }

            return true
          }
        }
      },
      column_id: {
        notEmpty: { errorMessage: CARDS_MESSAGES.COLUMN_ID_IS_REQUIRED },
        isString: { errorMessage: CARDS_MESSAGES.COLUMN_ID_MUST_BE_STRING },
        trim: true,
        custom: {
          options: async (value) => {
            if (!ObjectId.isValid(value)) {
              throw new Error(CARDS_MESSAGES.INVALID_COLUMN_ID)
            }

            const column = await databaseService.columns.findOne({
              _id: new ObjectId(value)
            })

            if (!column) {
              throw new Error(CARDS_MESSAGES.COLUMN_NOT_FOUND)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)

export const cardIdValidator = validate(
  checkSchema(
    {
      card_id: {
        custom: {
          options: async (value, { req }) => {
            if (!ObjectId.isValid(value)) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.BAD_REQUEST,
                message: CARDS_MESSAGES.INVALID_CARD_ID
              })
            }

            const card = await databaseService.cards.findOne({
              _id: new ObjectId(value)
            })

            if (!card) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.NOT_FOUND,
                message: CARDS_MESSAGES.CARD_NOT_FOUND
              })
            }

            const { user_id } = (req as Request).decoded_authorization as TokenPayload

            const checkUserCardAccess = await databaseService.boards.countDocuments({
              _id: card.board_id,
              $or: [
                {
                  owners: { $in: [new ObjectId(user_id)] }
                },
                {
                  members: { $in: [new ObjectId(user_id)] }
                }
              ]
            })

            if (!checkUserCardAccess) {
              throw new ErrorWithStatus({
                status: HTTP_STATUS.FORBIDDEN,
                message: CARDS_MESSAGES.CARD_NOT_BELONG_TO_USER
              })
            }

            ;(req as Request).card = card

            return true
          }
        }
      }
    },
    ['params']
  )
)

export const updateCardValidator = validate(
  checkSchema(
    {
      title: { ...cardTitleSchema, optional: true, notEmpty: undefined },
      due_date: {
        optional: true,
        custom: {
          options: (value) => {
            // Allow null value for due_date
            if (value === null) {
              return true
            }

            // Check if the value is a valid ISO 8601 date string
            const isValidDate = ISO8601_REGEX.test(value)

            if (!isValidDate) {
              throw new Error(CARDS_MESSAGES.CARD_DUE_DATE_MUST_BE_ISO8601)
            }

            return true
          }
        }
      },
      is_completed: {
        optional: true,
        custom: {
          options: (value) => {
            // Allow null value for is_completed
            if (value === null) {
              return true
            }

            if (typeof value !== 'boolean') {
              throw new Error(CARDS_MESSAGES.CARD_COMPLETION_STATUS_MUST_BE_BOOLEAN)
            }

            return true
          }
        }
      },
      description: {
        optional: true,
        isString: { errorMessage: CARDS_MESSAGES.CARD_DESCRIPTION_MUST_BE_STRING }
      },
      cover_photo: {
        optional: true,
        isString: { errorMessage: CARDS_MESSAGES.COVER_PHOTO_MUST_BE_STRING }
      },
      _destroy: {
        optional: true,
        custom: {
          options: (value) => {
            if (typeof value !== 'boolean' && typeof value !== 'undefined') {
              throw new Error(CARDS_MESSAGES.CARD_ARCHIVE_STATUS_MUST_BE_BOOLEAN)
            }

            return true
          }
        },
        toBoolean: true
      },
      comment: {
        optional: true,
        isObject: { errorMessage: CARDS_MESSAGES.COMMENT_MUST_BE_OBJECT },
        custom: {
          options: (value) => {
            // Check if all required fields of Comment interface exist
            const requiredFields = ['user_email', 'user_avatar', 'user_display_name', 'content']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${CARDS_MESSAGES.COMMENT_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            // Validate content is a string
            if (typeof value.content !== 'string') {
              throw new Error(CARDS_MESSAGES.COMMENT_CONTENT_MUST_BE_STRING)
            }

            return true
          }
        }
      },
      member: {
        optional: true,
        isObject: { errorMessage: CARDS_MESSAGES.MEMBER_MUST_BE_OBJECT },
        custom: {
          options: (value, { req }) => {
            const requiredFields = ['action', 'user_id']
            const hasAllRequiredFields = requiredFields.every((field) => field in value)

            if (!hasAllRequiredFields) {
              throw new Error(`${CARDS_MESSAGES.MEMBER_MISSING_REQUIRED_FIELDS}: ${requiredFields.join(', ')}`)
            }

            if (![CardMemberAction.Add, CardMemberAction.Remove].includes(value.action)) {
              throw new Error(CARDS_MESSAGES.INVALID_MEMBER_ACTION)
            }

            const card = (req as Request).card
            const memberExists = card?.members?.some((id) => id.equals(new ObjectId(value.user_id)))

            // For ADD action, check if member already exists
            if (value.action === CardMemberAction.Add && memberExists) {
              throw new Error(CARDS_MESSAGES.MEMBER_ALREADY_EXISTS)
            }

            // For REMOVE action, check if member doesn't exist
            if (value.action === CardMemberAction.Remove && !memberExists) {
              throw new Error(CARDS_MESSAGES.MEMBER_NOT_FOUND)
            }

            if (typeof value.user_id !== 'string' || !ObjectId.isValid(value.user_id)) {
              throw new Error(CARDS_MESSAGES.INVALID_MEMBER_ID)
            }

            return true
          }
        }
      }
    },
    ['body']
  )
)
